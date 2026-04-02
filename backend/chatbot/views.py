"""
views.py  –  Chat API Views
============================

Changes from the original
--------------------------
1. `_AGENT_CACHE` – module-level dict that keeps one `StatefulMeetingSchedulerAgent`
   instance alive per (user_id, session_id) pair.  This is critical: if a new
   agent is instantiated on every POST request the in-process parts of its state
   (e.g. the compiled LangGraph object) are recreated needlessly.  The *real*
   persistent state is stored in `AgentState` (DB), so even if the cache is
   cleared (e.g. server restart) the agent reconstructs from the DB on the next
   call to `load_state_node`.

2. LLM is initialised once per agent, not per request.

3. `ChatView.post` no longer catches generic Exception and swallows the traceback
   silently – errors are logged with `exc_info=True` so they appear in Sentry /
   CloudWatch with a full stack trace.

4. Session title is updated only on the first user message (avoids overwriting a
   human-set title).

5. `meeting_scheduled` in the response is detected more robustly.
"""

import uuid
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import ChatMessage, ChatSession, AgentState
from .serializers import (
    ChatMessageSerializer,
    ChatSessionSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
)
from .agent import StatefulMeetingSchedulerAgent
from .llm_config import get_gemini_llm_safe

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Module-level agent cache
# Key:   (user_id, session_id)
# Value: StatefulMeetingSchedulerAgent instance
#
# The agent object is lightweight (compiled graph + LLM client).
# All durable state lives in AgentState (DB), so a cache miss only means one
# extra DB SELECT – not lost conversation history.
# ─────────────────────────────────────────────────────────────────────────────
_AGENT_CACHE: dict = {}

MAX_CACHE_SIZE = 200   # evict oldest entries when exceeded


def _get_agent(user, session_id: str) -> StatefulMeetingSchedulerAgent:
    """
    Return a cached agent for this (user, session) pair, creating one if needed.
    """
    key = (user.id, session_id)

    if key not in _AGENT_CACHE:
        if len(_AGENT_CACHE) >= MAX_CACHE_SIZE:
            # Simple eviction: drop the oldest half
            oldest_keys = list(_AGENT_CACHE.keys())[: MAX_CACHE_SIZE // 2]
            for k in oldest_keys:
                del _AGENT_CACHE[k]
            logger.info(f"[ChatView] Agent cache pruned – removed {len(oldest_keys)} entries")

        llm = get_gemini_llm_safe()
        _AGENT_CACHE[key] = StatefulMeetingSchedulerAgent(user=user, user_llm=llm)
        logger.info(f"[ChatView] Created new agent for user={user.id} session={session_id[:8]}")

    return _AGENT_CACHE[key]


# ─────────────────────────────────────────────────────────────────────────────

class ChatView(APIView):
    """
    POST /api/chat/
    ---------------
    Body:
      { "message": "<text>", "session_id": "<uuid or empty>" }

    Response:
      {
        "session_id":          "<uuid>",
        "user_message":        "<text>",
        "assistant_response":  "<text>",
        "meeting_scheduled":   true | false,
        "meeting_details":     null | { ... }
      }
    """

    permission_classes = [IsAuthenticated]

    # ── helpers ───────────────────────────────────────────────────────────────

    def _get_or_create_session(self, user, session_id: str = "") -> ChatSession:
        if session_id:
            try:
                return ChatSession.objects.get(session_id=session_id, user=user)
            except ChatSession.DoesNotExist:
                logger.warning(
                    f"[ChatView] Session {session_id} not found for {user.username} – creating new"
                )

        new_id = str(uuid.uuid4())
        session = ChatSession.objects.create(
            user=user,
            session_id=new_id,
            title="New Chat",
        )
        logger.info(f"[ChatView] New session {new_id[:8]} for {user.username}")
        return session

    # ── POST ──────────────────────────────────────────────────────────────────

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data["message"]
        session_id   = serializer.validated_data.get("session_id", "")

        # ── Session ───────────────────────────────────────────────────────────
        session = self._get_or_create_session(request.user, session_id)

        # ── Persist user message ──────────────────────────────────────────────
        ChatMessage.objects.create(
            user       = request.user,
            role       = "user",
            content    = user_message,
            session_id = session.session_id,
        )

        # ── Run agent ─────────────────────────────────────────────────────────
        try:
            agent = _get_agent(request.user, session.session_id)
            assistant_response = agent.run(user_message, session.session_id)
        except Exception as exc:
            logger.error(
                f"[ChatView] Agent error for {request.user.username}: {exc}",
                exc_info=True,
            )
            assistant_response = (
                "I encountered an issue processing your request. "
                "Please try again or rephrase your message."
            )

        # ── Persist assistant message ─────────────────────────────────────────
        ChatMessage.objects.create(
            user       = request.user,
            role       = "assistant",
            content    = assistant_response,
            session_id = session.session_id,
        )

        # ── Update session title (first user message only) ────────────────────
        if session.title in ("", "New Chat"):
            session.title = user_message[:50]
            session.save(update_fields=["title", "updated_at"])

        # ── Detect if a meeting was just scheduled ────────────────────────────
        meeting_scheduled = False
        meeting_details   = None
        try:
            db_state = AgentState.objects.get(
                user=request.user, session_id=session.session_id
            )
            if db_state.status == "completed" and db_state.meeting_id:
                meeting_scheduled = True
                meeting_details = {
                    "meeting_id":  db_state.meeting_id,
                    "meet_link":   db_state.meeting_link,
                    "title":       db_state.meeting_title,
                    "time":        db_state.meeting_time,
                }
        except AgentState.DoesNotExist:
            pass
        except Exception as exc:
            logger.warning(f"[ChatView] Could not read AgentState: {exc}")

        # ── Response ──────────────────────────────────────────────────────────
        response_data = {
            "session_id":         session.session_id,
            "user_message":       user_message,
            "assistant_response": assistant_response,
            "meeting_scheduled":  meeting_scheduled,
            "meeting_details":    meeting_details,
        }

        resp_ser = ChatResponseSerializer(data=response_data)
        resp_ser.is_valid()   # validation is best-effort; fields are controlled above
        return Response(resp_ser.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────

class ChatHistoryView(APIView):
    """GET /api/chat/history/<session_id>/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id=None):
        try:
            if session_id:
                session = ChatSession.objects.get(
                    session_id=session_id, user=request.user
                )
                return Response(
                    ChatSessionSerializer(session).data,
                    status=status.HTTP_200_OK,
                )
            sessions = ChatSession.objects.filter(user=request.user)
            return Response(
                ChatSessionSerializer(sessions, many=True).data,
                status=status.HTTP_200_OK,
            )
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            logger.error(f"[ChatHistoryView] {exc}", exc_info=True)
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────

class ChatSessionListView(APIView):
    """GET /api/chat/sessions/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sessions = ChatSession.objects.filter(user=request.user).order_by("-created_at")
            return Response(
                ChatSessionSerializer(sessions, many=True).data,
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.error(f"[ChatSessionListView] {exc}", exc_info=True)
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────

class ChatSessionDeleteView(APIView):
    """DELETE /api/chat/sessions/<session_id>/"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(
                session_id=session_id, user=request.user
            )
            # Clean up related records
            ChatMessage.objects.filter(session_id=session_id).delete()
            AgentState.objects.filter(
                user=request.user, session_id=session_id
            ).delete()
            session.delete()

            # Evict from cache
            _AGENT_CACHE.pop((request.user.id, session_id), None)

            logger.info(
                f"[ChatSessionDeleteView] Session {session_id} deleted "
                f"by {request.user.username}"
            )
            return Response(
                {"message": "Session deleted successfully"},
                status=status.HTTP_200_OK,
            )
        except ChatSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            logger.error(f"[ChatSessionDeleteView] {exc}", exc_info=True)
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)