"""
models.py  –  Chat application models
=======================================

Changes from the original
--------------------------
AgentState
  • Added "in_progress" to SESSION_STATUS_CHOICES (was missing, caused DB
    IntegrityError when the agent tried to save status="in_progress").
  • Added `agenda` field that was referenced in agent.py but absent from the model.
  • `is_complete()` now uses the same field names as the agent (meeting_time, not
    a separate parsed datetime).
  • Minor: `reset_for_new_turn` now also clears `meeting_title`, `meeting_time`,
    `participants_json`, and `missing_details_json` so retries start clean.
"""

from django.db import models
from django.conf import settings
import json


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user",      "User"),
        ("assistant", "Assistant"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content    = models.TextField()
    session_id = models.CharField(max_length=255, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username} – {self.role} – {self.created_at:%Y-%m-%d %H:%M}"


# ─────────────────────────────────────────────────────────────────────────────

class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_sessions",
    )
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    title      = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_session"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} – {self.session_id}"


# ─────────────────────────────────────────────────────────────────────────────

class AgentState(models.Model):
    """
    Stores per-session workflow state so the agent can continue a conversation
    across multiple HTTP requests (multi-turn).

    Status lifecycle
    ----------------
    collecting  →  in_progress  →  confirming  →  completed
                                               ↘  failed
    Any status can transition back to collecting if the user cancels.
    """

    SESSION_STATUS_CHOICES = [
        ("collecting",   "Collecting information"),
        ("in_progress",  "In progress"),          # ← was missing in original
        ("confirming",   "Awaiting user confirmation"),
        ("completed",    "Meeting scheduled"),
        ("failed",       "Failed"),
    ]

    # ── Identifiers ──────────────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="agent_states",
    )
    session_id = models.CharField(max_length=255, db_index=True)

    # ── Collected meeting details ─────────────────────────────────────────────
    is_meeting_request = models.BooleanField(default=False)
    meeting_title      = models.CharField(max_length=255, blank=True)
    meeting_time       = models.CharField(max_length=255, blank=True)  # natural-language string
    agenda             = models.TextField(blank=True)                   # ← added

    # ── Participants (JSON list of {name, email, status}) ─────────────────────
    participants_json = models.TextField(default="[]")

    # ── Missing information tracking (JSON list of field names) ───────────────
    missing_details_json = models.TextField(default="[]")

    # ── Workflow status ───────────────────────────────────────────────────────
    status           = models.CharField(
        max_length=50,
        choices=SESSION_STATUS_CHOICES,
        default="collecting",
    )
    last_turn_summary = models.CharField(max_length=500, blank=True)

    # ── Error tracking ────────────────────────────────────────────────────────
    error_message = models.TextField(blank=True)
    retry_count   = models.IntegerField(default=0)

    # ── Meeting result (populated after successful creation) ──────────────────
    meeting_id   = models.IntegerField(null=True, blank=True)
    meeting_link = models.URLField(blank=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = "agent_state"
        unique_together = [["user", "session_id"]]
        ordering        = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username} – {self.session_id[:8]}… ({self.status})"

    # ── JSON helpers ──────────────────────────────────────────────────────────

    def get_participants(self) -> list:
        """Return decoded participants list."""
        try:
            return json.loads(self.participants_json) if self.participants_json else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_participants(self, participants: list):
        """Encode and store participants list."""
        self.participants_json = json.dumps(participants or [])

    def get_missing_details(self) -> list:
        """Return decoded missing-details list."""
        try:
            return json.loads(self.missing_details_json) if self.missing_details_json else []
        except (json.JSONDecodeError, TypeError):
            return []

    def set_missing_details(self, details: list):
        """Encode and store missing-details list."""
        self.missing_details_json = json.dumps(details or [])

    # ── Convenience ───────────────────────────────────────────────────────────

    def is_complete(self) -> bool:
        """True when every required field is present and all participants have emails."""
        participants = self.get_participants()
        return bool(
            self.is_meeting_request
            and self.meeting_title
            and self.meeting_time
            and participants
            and all(p.get("email") for p in participants)
            and not self.get_missing_details()
        )

    def reset_for_new_meeting(self):
        """
        Reset this state record so the user can start a completely new meeting
        request in the same session (e.g. after a cancellation).
        """
        self.is_meeting_request   = False
        self.meeting_title        = ""
        self.meeting_time         = ""
        self.agenda               = ""
        self.participants_json    = "[]"
        self.missing_details_json = "[]"
        self.status               = "collecting"
        self.last_turn_summary    = ""
        self.error_message        = ""
        self.meeting_id           = None
        self.meeting_link         = ""
        self.retry_count         += 1
        self.save()

    # kept for backwards compat
    def reset_for_new_turn(self):
        self.reset_for_new_meeting()