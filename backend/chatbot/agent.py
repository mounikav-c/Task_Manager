"""
agent.py  –  Stateful Multi-Turn Meeting Scheduling Agent
==========================================================

Key design decisions
---------------------
1. **LLM-first extraction** – Gemini extracts every detail (names, time, title).
   Regex is GONE as a primary path; it is only used as a last-resort safety net
   inside `_safe_extract_json` to peel markdown fences off LLM output.

2. **State lives in the DB** – `AgentState` is loaded at the start of every
   `.run()` call and saved at the end.  The LangGraph `StateGraph` dict is just
   a scratch-pad for the current turn; it is populated from the DB and written
   back before the function returns.

3. **One question per turn** – The agent asks for exactly ONE missing piece of
   information per turn, making the conversation feel natural.

4. **Email-first participant handling** – If the user supplies raw email
   addresses the agent accepts them immediately and skips the DB lookup.
   Names are looked up in the DB; if not found the user is asked to provide
   the email directly.

5. **Google Calendar / Meet integration** – `_create_google_meet_event` tries
   the Calendar API and falls back to a deterministic UUID-based link so
   development still works without OAuth credentials.

6. **`views.py` caches agents per session** – see the module-level
   `_AGENT_CACHE` in views.py; the agent object itself is lightweight, the
   real state is in the DB.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from uuid import uuid4

from langgraph.graph import StateGraph, END
from langchain.schema import HumanMessage, SystemMessage

from django.contrib.auth import get_user_model

from accounts.models import AuthUserProfile, TeamMember, Meeting
from .models import ChatMessage, AgentState
from .email_service import send_bulk_meeting_invitations

logger = logging.getLogger(__name__)
User = get_user_model()


# ─────────────────────────────────────────────────────────────────────────────
# Google Calendar helper  (graceful degradation when creds are absent)
# ─────────────────────────────────────────────────────────────────────────────

def _create_google_meet_event(
    title: str,
    scheduled_for: datetime,
    attendee_emails: List[str],
    organizer_email: str,
) -> str:
    """
    Creates a Google Calendar event with a Meet link.

    Requires:
      - GOOGLE_CALENDAR_CREDENTIALS_JSON env var  (service-account JSON string)
        OR  GOOGLE_OAUTH_TOKEN env var (user OAuth token JSON string)
      - The calendar scope: https://www.googleapis.com/auth/calendar

    Falls back to a stable UUID-based meet link if the API call fails.
    """
    import os

    fallback_code = str(uuid4()).replace("-", "")
    fallback_link = (
        f"https://meet.google.com/"
        f"{fallback_code[:3]}-{fallback_code[3:7]}-{fallback_code[7:11]}"
    )

    creds_json = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_JSON", "")
    if not creds_json:
        logger.warning("[MeetAgent] GOOGLE_CALENDAR_CREDENTIALS_JSON not set – using fallback link")
        return fallback_link

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds_data = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(
            creds_data,
            scopes=["https://www.googleapis.com/auth/calendar"],
        )

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        end_time = scheduled_for + timedelta(minutes=30)

        event = {
            "summary": title,
            "start": {"dateTime": scheduled_for.isoformat(), "timeZone": "Asia/Kolkata"},
            "end":   {"dateTime": end_time.isoformat(),       "timeZone": "Asia/Kolkata"},
            "attendees": [{"email": e} for e in attendee_emails],
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
            "reminders": {"useDefault": True},
        }

        created = service.events().insert(
            calendarId="primary",
            body=event,
            conferenceDataVersion=1,
            sendUpdates="all",
        ).execute()

        meet_link = (
            created.get("conferenceData", {})
            .get("entryPoints", [{}])[0]
            .get("uri", fallback_link)
        )
        logger.info(f"[MeetAgent] Google Meet event created: {meet_link}")
        return meet_link

    except Exception as exc:
        logger.error(f"[MeetAgent] Google Calendar API error: {exc}", exc_info=True)
        return fallback_link


# ─────────────────────────────────────────────────────────────────────────────
# Agent
# ─────────────────────────────────────────────────────────────────────────────

class StatefulMeetingSchedulerAgent:
    """
    LangGraph-powered multi-turn meeting scheduler.

    Public API
    ----------
    agent.run(user_message, session_id)  →  str (bot reply)
    """

    # Stages used by the state-machine stored in AgentState.status
    STAGE_COLLECTING  = "collecting"    # gathering details
    STAGE_CONFIRMING  = "confirming"    # showing summary, waiting for yes/no
    STAGE_COMPLETED   = "completed"     # meeting created
    STAGE_FAILED      = "failed"

    def __init__(self, user, user_llm=None):
        self.user = user
        self.llm  = user_llm
        self.graph = self._build_graph()

    # ─────────────────────────── Graph ───────────────────────────────────────

    def _build_graph(self):
        wf = StateGraph(dict)

        wf.add_node("load_state",          self.load_state_node)
        wf.add_node("classify_message",    self.classify_message_node)
        wf.add_node("extract_details",     self.extract_details_node)
        wf.add_node("resolve_participants",self.resolve_participants_node)
        wf.add_node("check_completeness",  self.check_completeness_node)
        wf.add_node("confirm_with_user",   self.confirm_with_user_node)
        wf.add_node("create_meeting",      self.create_meeting_node)
        wf.add_node("compose_reply",       self.compose_reply_node)

        wf.add_edge("load_state", "classify_message")

        wf.add_conditional_edges(
            "classify_message",
            self._route_classify,
            {
                "meeting":  "extract_details",
                "confirm":  "create_meeting",   # user said "yes" to summary
                "cancel":   "compose_reply",
                "general":  "compose_reply",
            },
        )

        wf.add_edge("extract_details", "resolve_participants")
        wf.add_edge("resolve_participants", "check_completeness")

        wf.add_conditional_edges(
            "check_completeness",
            self._route_completeness,
            {
                "complete":   "confirm_with_user",
                "incomplete": "compose_reply",
            },
        )

        wf.add_edge("confirm_with_user", "compose_reply")
        wf.add_edge("create_meeting",    "compose_reply")
        wf.add_edge("compose_reply",     END)

        wf.set_entry_point("load_state")
        return wf.compile()

    # ─────────────────────────── Nodes ───────────────────────────────────────

    def load_state_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Load (or create) the AgentState row for this session."""
        session_id = state.get("session_id", "")

        db_state, created = AgentState.objects.get_or_create(
            user=self.user,
            session_id=session_id,
        )
        if created:
            logger.info(f"[MeetAgent] New session {session_id[:8]}")
        else:
            logger.info(
                f"[MeetAgent] Resumed session {session_id[:8]} "
                f"status={db_state.status}"
            )

        state["db_state"]    = db_state
        state["stage"]       = db_state.status or self.STAGE_COLLECTING
        state["title"]       = db_state.meeting_title
        state["meeting_time"]= db_state.meeting_time
        state["agenda"]      = db_state.agenda
        state["participants"]= db_state.get_participants()   # [{name, email, status}]
        state["missing"]     = db_state.get_missing_details()

        return state

    # ─────────────────────────────────────────────────────────────────────────

    def classify_message_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify the current user message into one of:
          meeting  – scheduling request or follow-up in an active meeting flow
          confirm  – user confirmed the summary ("yes", "ok", etc.)
          cancel   – user wants to abort
          general  – unrelated question
        """
        msg   = state.get("message", "")
        stage = state.get("stage", self.STAGE_COLLECTING)

        # If we are waiting for confirmation, check yes/no first
        if stage == self.STAGE_CONFIRMING:
            lower = msg.lower().strip()
            if any(w in lower for w in ["yes", "yep", "yeah", "ok", "sure", "confirm", "go ahead", "schedule it"]):
                state["classification"] = "confirm"
                logger.info("[MeetAgent] User confirmed → create meeting")
                return state
            if any(w in lower for w in ["no", "nope", "cancel", "stop", "abort", "don't"]):
                state["classification"] = "cancel"
                logger.info("[MeetAgent] User cancelled")
                return state
            # Any other reply while confirming = new info / correction
            state["classification"] = "meeting"
            logger.info("[MeetAgent] Mid-confirmation correction → re-extract")
            return state

        # If already collecting, any message continues the flow
        if stage == self.STAGE_COLLECTING:
            state["classification"] = "meeting"
            logger.info("[MeetAgent] Continuing collection flow")
            return state

        # Fresh turn – use LLM to classify
        classification = self._llm_classify(msg)
        state["classification"] = classification
        logger.info(f"[MeetAgent] LLM classified as '{classification}'")
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def extract_details_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use the LLM to extract / update meeting details from the latest message.
        Merges new data on top of whatever was already collected.
        """
        msg = state.get("message", "")

        existing = {
            "title":        state.get("title", ""),
            "meeting_time": state.get("meeting_time", ""),
            "agenda":       state.get("agenda", ""),
            "participants": state.get("participants", []),
        }

        prompt_system = """You are a detail-extraction assistant for a meeting scheduler.

Given the user's latest message and the details collected so far, extract any NEW or UPDATED information.

Return ONLY a valid JSON object – no markdown, no explanation:
{
  "title":        "<string or null>",
  "meeting_time": "<natural-language string or null>",
  "agenda":       "<string or null>",
  "new_names":    ["list of plain names the user mentioned"],
  "new_emails":   ["list of email addresses the user mentioned"]
}

Rules:
- Return null for any field you cannot find in this message.
- Do NOT repeat information already in 'existing' unless the user explicitly changed it.
- Extract every email address exactly as written.
- Extract every person's name exactly as written (preserve capitalisation).
- If the user said something like "venky, uma, sriya" treat each comma-separated token as a name.
"""

        prompt_user = f"""Existing details:
{json.dumps(existing, indent=2)}

User's latest message:
\"{msg}\"
"""

        extracted = {}
        try:
            if self.llm:
                response = self.llm.invoke([
                    SystemMessage(content=prompt_system),
                    HumanMessage(content=prompt_user),
                ])
                extracted = self._safe_parse_json(response.content)
                logger.info(f"[MeetAgent] LLM extracted: {extracted}")
            else:
                logger.warning("[MeetAgent] No LLM – extraction skipped")
        except Exception as exc:
            logger.error(f"[MeetAgent] extract_details LLM error: {exc}", exc_info=True)

        # ── Merge extracted data onto existing state ──────────────────────
        if extracted.get("title"):
            state["title"] = extracted["title"]
        if extracted.get("meeting_time"):
            state["meeting_time"] = extracted["meeting_time"]
        if extracted.get("agenda"):
            state["agenda"] = extracted["agenda"]

        # Build a combined participant list (no duplicates by lower-name key)
        participant_map: Dict[str, Dict] = {
            p["name"].lower(): p for p in state.get("participants", [])
        }

        for email in extracted.get("new_emails", []):
            if not email or "@" not in email:
                continue
            name = email.split("@")[0].replace(".", " ").replace("_", " ").title()
            key  = name.lower()
            if key not in participant_map:
                participant_map[key] = {"name": name, "email": email, "status": "email_provided"}
            else:
                participant_map[key]["email"]  = email
                participant_map[key]["status"] = "email_provided"

        for name in extracted.get("new_names", []):
            name = name.strip()
            if not name:
                continue
            key = name.lower()
            if key not in participant_map:
                participant_map[key] = {"name": name, "email": "", "status": "pending"}

        state["participants"] = list(participant_map.values())
        logger.info(
            f"[MeetAgent] After merge – title={state['title']!r} "
            f"time={state['meeting_time']!r} "
            f"participants={[p['name'] for p in state['participants']]}"
        )
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def resolve_participants_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        For participants that have no email yet, look them up in the DB.
        Participants with emails are accepted as-is.
        """
        updated: List[Dict] = []

        for p in state.get("participants", []):
            name   = p.get("name", "").strip()
            email  = p.get("email", "").strip()
            status = p.get("status", "pending")

            if email and "@" in email:
                # Email already known – nothing to do
                updated.append({**p, "status": "confirmed"})
                continue

            # Try DB lookup
            found_email = self._db_lookup_email(name)
            if found_email:
                updated.append({"name": name, "email": found_email, "status": "found"})
                logger.info(f"[MeetAgent] DB found {name} → {found_email}")
            else:
                updated.append({"name": name, "email": "", "status": "not_found"})
                logger.warning(f"[MeetAgent] DB: no email for {name!r}")

        state["participants"] = updated

        unresolved = [p["name"] for p in updated if not p.get("email")]
        state["unresolved"] = unresolved
        logger.info(
            f"[MeetAgent] Resolve done – "
            f"{len(updated) - len(unresolved)} resolved, "
            f"{len(unresolved)} unresolved: {unresolved}"
        )
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def check_completeness_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine what is still missing and set state["missing"] accordingly.
        MUST have: participants WITH emails, title, AND time before confirmation.
        """
        missing: List[str] = []

        resolved = [p for p in state.get("participants", []) if p.get("email")]

        if not resolved:
            if state.get("unresolved"):
                missing.append("participant_email")   # have names but no emails
            else:
                missing.append("participants")        # no names at all

        if not state.get("meeting_time"):
            missing.append("time")

        if not state.get("title"):
            missing.append("title")
            # Set default for display purposes, but track as missing
            state["title"] = "(not specified yet)"

        state["missing"] = missing
        logger.info(f"[MeetAgent] Missing fields: {missing}")
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def confirm_with_user_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        All details are present. Build a summary and ask for confirmation.
        Sets stage to CONFIRMING.
        """
        state["stage"] = self.STAGE_CONFIRMING
        self._persist_state(state)      # save CONFIRMING stage to DB now
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def create_meeting_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        User confirmed. Create the DB record, Google Meet link, and send emails.
        """
        try:
            participants = [p for p in state.get("participants", []) if p.get("email")]
            title        = state.get("title") or "Meeting"
            time_str     = state.get("meeting_time", "")
            agenda       = state.get("agenda", "")

            logger.info(f"[MeetAgent] Creating meeting with {len(participants)} participants: {[p['name'] for p in participants]}")

            scheduled_dt = self._parse_datetime(time_str)

            # Organiser info
            organizer_name  = self._organizer_name()
            organizer_email = self.user.email or ""

            attendee_emails = [p["email"] for p in participants]

            # Google Meet / Calendar
            meet_link = _create_google_meet_event(
                title           = title,
                scheduled_for   = scheduled_dt,
                attendee_emails = attendee_emails,
                organizer_email = organizer_email,
            )

            # TeamMember organizer (optional FK in Meeting model)
            organizer_tm = (
                TeamMember.objects.filter(name__icontains=self.user.first_name).first()
            )

            # Create Meeting record
            meeting = Meeting.objects.create(
                title            = title,
                agenda           = agenda,
                scheduled_for    = scheduled_dt,
                duration_minutes = 30,
                meeting_link     = meet_link,
                organizer        = organizer_tm,
                status           = "scheduled",
            )

            # Add TeamMember attendees where possible
            for p in participants:
                tm = TeamMember.objects.filter(name__icontains=p["name"].split()[0]).first()
                if tm:
                    meeting.attendees.add(tm)

            # Send invitation emails
            scheduled_str = scheduled_dt.strftime("%B %d, %Y at %I:%M %p")
            recipient_data = [{"email": p["email"], "name": p["name"]} for p in participants]
            logger.info(f"[MeetAgent] Sending invitations to: {recipient_data}")
            
            results = send_bulk_meeting_invitations(
                recipient_list  = recipient_data,
                meeting_title   = title,
                meeting_time    = scheduled_str,
                meeting_link    = meet_link,
                organizer_name  = organizer_name,
            )
            emails_sent = len(results.get("sent", []))
            emails_failed = len(results.get("failed", []))
            
            logger.info(f"[MeetAgent] Email results: {emails_sent} sent, {emails_failed} failed")
            if results.get("failed"):
                logger.warning(f"[MeetAgent] Failed emails: {results['failed']}")

            state["meeting_created"]     = True
            state["meet_link"]           = meet_link
            state["emails_sent"]         = emails_sent
            state["scheduled_str"]       = scheduled_str
            state["stage"]               = self.STAGE_COMPLETED

            # Persist to AgentState
            db_state: AgentState = state["db_state"]
            db_state.meeting_id   = meeting.id
            db_state.meeting_link = meet_link
            db_state.status       = self.STAGE_COMPLETED
            db_state.save()

            logger.info(
                f"[MeetAgent] Meeting {meeting.id} created. "
                f"Meet={meet_link}. Emails={emails_sent}"
            )

        except Exception as exc:
            logger.error(f"[MeetAgent] create_meeting error: {exc}", exc_info=True)
            state["meeting_created"] = False
            state["error_text"]      = str(exc)

        return state

    # ─────────────────────────────────────────────────────────────────────────

    def compose_reply_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use the LLM to write the final user-facing reply.
        We give it a structured context so it NEVER hallucinates details.
        """
        classification = state.get("classification", "general")
        stage          = state.get("stage", self.STAGE_COLLECTING)
        missing        = state.get("missing", [])
        unresolved     = state.get("unresolved", [])
        participants   = [p for p in state.get("participants", []) if p.get("email")]
        title          = state.get("title", "Meeting")
        time_str       = state.get("meeting_time", "")

        # ── Cancel ───────────────────────────────────────────────────────────
        if classification == "cancel":
            state["stage"] = self.STAGE_COLLECTING
            state["db_state"].status = self.STAGE_COLLECTING
            state["db_state"].meeting_title = ""
            state["db_state"].meeting_time  = ""
            state["db_state"].set_participants([])
            state["db_state"].set_missing_details([])
            state["db_state"].save()
            reply = (
                "No problem! I've cancelled the scheduling. "
                "Let me know whenever you'd like to set up a meeting. 😊"
            )
            state["response"] = reply
            return state

        # ── Meeting created ───────────────────────────────────────────────
        if state.get("meeting_created"):
            names = ", ".join(p["name"] for p in participants)
            context = (
                f"Meeting scheduled successfully.\n"
                f"Title: {title}\n"
                f"Participants: {names}\n"
                f"Time: {state.get('scheduled_str', time_str)}\n"
                f"Google Meet link: {state.get('meet_link', '')}\n"
                f"Invitation emails sent: {state.get('emails_sent', 0)}"
            )
            instruction = (
                "Write a warm, concise confirmation. "
                "Include the title, participants, time, and Google Meet link. "
                "Use emojis. Max 5 lines."
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Error creating meeting ────────────────────────────────────────
        if state.get("error_text"):
            context     = f"Error occurred while creating meeting: {state['error_text']}"
            instruction = "Apologise briefly and ask the user to try again."
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Confirmation summary (waiting for yes/no) ─────────────────────
        if stage == self.STAGE_CONFIRMING:
            names = ", ".join(p["name"] for p in participants)
            context = (
                f"Showing meeting summary to user. Waiting for confirmation.\n"
                f"Title: {title}\n"
                f"Participants: {names}\n"
                f"Time: {time_str}\n"
            )
            instruction = (
                "Show the meeting details neatly (use emoji bullets). "
                "Then ask: 'Shall I go ahead and schedule this? (yes / no)'"
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Missing participant emails ─────────────────────────────────────
        if "participant_email" in missing and unresolved:
            not_found = ", ".join(unresolved)
            context = (
                f"Could not find these names in the system: {not_found}.\n"
                f"Need to ask the user for their email addresses."
            )
            instruction = (
                "Politely say you couldn't find those names in the database. "
                "Ask the user to share their email addresses directly. "
                "Be specific about which names weren't found. Keep it to 2-3 sentences."
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Missing participants entirely ─────────────────────────────────
        if "participants" in missing:
            context     = "No participants have been mentioned yet."
            instruction = (
                "Ask who should be invited. Mention they can give names (looked up in the system) "
                "or email addresses directly. Keep it to 1-2 sentences."
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Missing title ─────────────────────────────────────────────────
        if "title" in missing:
            names = ", ".join(p["name"] for p in participants)
            context = (
                f"Participants confirmed: {names}. "
                f"Meeting title/purpose is missing."
            )
            instruction = (
                "Tell the user who's attending, then ask what this meeting is about or what the title should be. "
                "Keep it friendly and brief."
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── Missing time ──────────────────────────────────────────────────
        if "time" in missing:
            names = ", ".join(p["name"] for p in participants)
            context = (
                f"Participants are confirmed: {names}. "
                f"Meeting time is still missing."
            )
            instruction = (
                "Tell the user who will be invited, then ask what time the meeting should be. "
                "Give 1-2 example formats. Keep it friendly and brief."
            )
            state["response"] = self._llm_reply(context, instruction, state)
            self._persist_state(state)
            return state

        # ── General / off-topic ───────────────────────────────────────────
        context     = f"User said: {state.get('message', '')}"
        instruction = (
            "Respond helpfully. If it's general chat answer naturally. "
            "If it could be meeting-related, gently offer to help schedule one. "
            "Keep it concise."
        )
        state["response"] = self._llm_reply(context, instruction, state)
        self._persist_state(state)
        return state

    # ─────────────────────────────────────────────────────────────────────────

    def handle_error_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        state["response"] = (
            "I ran into an unexpected issue. Could you rephrase that or start over? 🙏"
        )
        return state

    # ─────────────────────────── Routers ─────────────────────────────────────

    def _route_classify(self, state: Dict[str, Any]) -> str:
        return state.get("classification", "general")

    def _route_completeness(self, state: Dict[str, Any]) -> str:
        return "complete" if not state.get("missing") else "incomplete"

    # ─────────────────────────── Helpers ─────────────────────────────────────

    def _llm_classify(self, message: str) -> str:
        """Return 'meeting' | 'general' using the LLM."""
        if not self.llm:
            return self._keyword_classify(message)

        prompt = f"""Classify the intent of this message into ONE of:
- "meeting"  → user wants to schedule, book, or arrange a meeting / call / sync
- "general"  → everything else

Reply ONLY with the single word (no quotes, no explanation).

Message: {message}"""
        try:
            resp = self.llm.invoke([HumanMessage(content=prompt)])
            word = resp.content.strip().lower().split()[0]
            return "meeting" if "meeting" in word else "general"
        except Exception as exc:
            logger.warning(f"[MeetAgent] classify LLM error: {exc}")
            return self._keyword_classify(message)

    def _keyword_classify(self, message: str) -> str:
        keywords = [
            "schedule", "meeting", "call", "invite", "sync", "standup",
            "1:1", "one-on-one", "conference", "arrange", "book",
            "set up", "meet with", "let's meet",
        ]
        return "meeting" if any(k in message.lower() for k in keywords) else "general"

    # ─────────────────────────────────────────────────────────────────────────

    def _llm_reply(self, context: str, instruction: str, state: Dict) -> str:
        """
        Ask the LLM to produce the conversational reply.
        Passes recent history for conversational coherence.
        """
        if not self.llm:
            return context   # bare fallback

        history_lines = []
        session_id = state.get("session_id", "")
        if session_id:
            try:
                msgs = (
                    ChatMessage.objects
                    .filter(session_id=session_id, user=self.user)
                    .order_by("-created_at")[:6]
                )
                for m in reversed(list(msgs)):
                    label = "User" if m.role == "user" else "Assistant"
                    history_lines.append(f"{label}: {m.content}")
            except Exception:
                pass

        history_ctx = "\n".join(history_lines) if history_lines else "(no prior history)"

        system = f"""You are a friendly AI assistant helping schedule meetings.

INSTRUCTION: {instruction}

CONTEXT (facts – do NOT deviate from these):
{context}

CONVERSATION SO FAR:
{history_ctx}

Rules:
- Never invent participant names, times, or links not listed in CONTEXT.
- Be warm, concise, and use emojis where appropriate.
- Do not repeat yourself from previous turns unless summarising for confirmation.
"""
        try:
            resp = self.llm.invoke([
                SystemMessage(content=system),
                HumanMessage(content=state.get("message", "")),
            ])
            return resp.content.strip()
        except Exception as exc:
            logger.error(f"[MeetAgent] _llm_reply error: {exc}", exc_info=True)
            return "I'm here to help! Could you rephrase that?"

    # ─────────────────────────────────────────────────────────────────────────

    def _db_lookup_email(self, name: str) -> Optional[str]:
        """Try several DB strategies to find an email for a name."""
        first = name.split()[0] if name else ""

        # 1. User model by first name
        try:
            u = User.objects.filter(first_name__iexact=first).first()
            if u and u.email:
                return u.email
        except Exception:
            pass

        # 2. AuthUserProfile
        try:
            p = AuthUserProfile.objects.filter(user__first_name__iexact=first).first()
            if p and p.email:
                return p.email
        except Exception:
            pass

        # 3. TeamMember
        try:
            tm = TeamMember.objects.filter(name__icontains=first).first()
            if tm and getattr(tm, "email", None):
                return tm.email
            # TeamMember → linked user
            if tm:
                linked = User.objects.filter(first_name__iexact=first).first()
                if linked and linked.email:
                    return linked.email
        except Exception:
            pass

        return None

    # ─────────────────────────────────────────────────────────────────────────

    def _parse_datetime(self, time_str: str) -> datetime:
        from dateutil import parser as dp

        default = (datetime.now() + timedelta(days=1)).replace(
            hour=14, minute=0, second=0, microsecond=0
        )
        if not time_str or time_str.lower() in ("tbd", ""):
            return default
        try:
            parsed = dp.parse(time_str, fuzzy=True, default=default)
            if parsed < datetime.now():
                parsed += timedelta(days=1)
            return parsed
        except Exception:
            return default

    # ─────────────────────────────────────────────────────────────────────────

    def _organizer_name(self) -> str:
        try:
            profile = AuthUserProfile.objects.get(user=self.user)
            return profile.full_name or self.user.get_full_name() or self.user.username
        except Exception:
            return self.user.get_full_name() or self.user.username

    # ─────────────────────────────────────────────────────────────────────────

    def _persist_state(self, state: Dict):
        """Write the current turn's collected data back to AgentState."""
        db: AgentState = state.get("db_state")
        if not db:
            return
        try:
            db.is_meeting_request = state.get("classification") == "meeting"
            db.meeting_title      = state.get("title", "") or ""
            db.meeting_time       = state.get("meeting_time", "") or ""
            db.agenda             = state.get("agenda", "") or ""
            db.status             = state.get("stage", self.STAGE_COLLECTING)
            db.last_turn_summary  = (state.get("response", "") or "")[:500]
            db.set_participants(state.get("participants", []))
            db.set_missing_details(state.get("missing", []))
            db.save()
            logger.info(f"[MeetAgent] DB persisted – stage={db.status}")
        except Exception as exc:
            logger.error(f"[MeetAgent] _persist_state error: {exc}", exc_info=True)

    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _safe_parse_json(text: str) -> Dict:
        """Strip markdown fences and parse JSON safely."""
        text = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$",         "", text)
        text = text.strip()
        # Find first { … }
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            text = m.group(0)
        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.warning(f"[MeetAgent] JSON parse failed: {exc} | raw={text[:200]}")
            return {}

    # ─────────────────────────── Public API ──────────────────────────────────

    def run(self, user_message: str, session_id: str = "") -> str:
        """
        Process one user turn and return the bot's reply.

        Args:
            user_message: Raw text from the user.
            session_id:   ChatSession.session_id for state tracking.

        Returns:
            str: The agent's conversational reply.
        """
        input_state = {
            "message":    user_message,
            "session_id": session_id,
        }
        try:
            output = self.graph.invoke(input_state)
            return output.get("response", "I'm ready to help you schedule a meeting!")
        except Exception as exc:
            logger.error(f"[MeetAgent] run() error: {exc}", exc_info=True)
            return "I encountered an error. Please try again."


# Backwards-compatible alias
MeetingSchedulerAgent = StatefulMeetingSchedulerAgent