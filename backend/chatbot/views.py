import uuid
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils.text import slugify

from .models import ChatMessage, ChatSession
from .serializers import (
    ChatMessageSerializer,
    ChatSessionSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer
)
from .agent import MeetingSchedulerAgent
from .llm_config import get_gemini_llm_safe

logger = logging.getLogger(__name__)


class ChatView(APIView):
    """API endpoint for chat interactions"""
    permission_classes = [IsAuthenticated]
    
    def get_or_create_session(self, user, session_id=None):
        """Get existing session or create a new one"""
        if session_id:
            try:
                session = ChatSession.objects.get(session_id=session_id, user=user)
                return session
            except ChatSession.DoesNotExist:
                logger.warning(f"Session {session_id} not found for user {user.username}")
        
        # Create new session
        new_session_id = str(uuid.uuid4())
        session = ChatSession.objects.create(
            user=user,
            session_id=new_session_id,
            title="New Chat"
        )
        return session
    
    def post(self, request):
        """Handle chat message"""
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_message = serializer.validated_data["message"]
        session_id = serializer.validated_data.get("session_id", "")
        
        try:
            # Get or create session
            session = self.get_or_create_session(request.user, session_id)
            
            # Save user message
            user_msg_record = ChatMessage.objects.create(
                user=request.user,
                role="user",
                content=user_message,
                session_id=session.session_id
            )
            
            # Run the agent with Gemini LLM
            try:
                llm = get_gemini_llm_safe()
                agent = MeetingSchedulerAgent(request.user, user_llm=llm)
                assistant_response = agent.run(user_message, session.session_id)
            except Exception as e:
                logger.error(f"Error running agent: {str(e)}", exc_info=True)
                assistant_response = f"I encountered an issue processing your request. Please try again or try a different question."
            
            # Save assistant response
            assistant_msg_record = ChatMessage.objects.create(
                user=request.user,
                role="assistant",
                content=assistant_response,
                session_id=session.session_id
            )
            
            # Update session title if it's empty
            if not session.title or session.title == "New Chat":
                # Use first 50 chars of user message as title
                session.title = user_message[:50]
                session.save()
            
            # Prepare response
            response_data = {
                "session_id": session.session_id,
                "user_message": user_message,
                "assistant_response": assistant_response,
                "meeting_scheduled": "✅ Meeting scheduled successfully" in assistant_response,
                "meeting_details": None
            }
            
            response_serializer = ChatResponseSerializer(data=response_data)
            response_serializer.is_valid()
            
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error processing chat message: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHistoryView(APIView):
    """API endpoint to get chat history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_id=None):
        """Get chat history for a session or all sessions"""
        try:
            if session_id:
                # Get specific session
                session = ChatSession.objects.get(session_id=session_id, user=request.user)
                serializer = ChatSessionSerializer(session)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Get all sessions for user
                sessions = ChatSession.objects.filter(user=request.user)
                serializer = ChatSessionSerializer(sessions, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving chat history: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSessionListView(APIView):
    """API endpoint to list all chat sessions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all chat sessions for the authenticated user"""
        try:
            sessions = ChatSession.objects.filter(user=request.user).order_by("-created_at")
            serializer = ChatSessionSerializer(sessions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing chat sessions: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSessionDeleteView(APIView):
    """API endpoint to delete a specific chat session"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, session_id):
        """Delete a specific chat session and its messages"""
        try:
            session = ChatSession.objects.get(session_id=session_id, user=request.user)
            # Delete associated messages
            ChatMessage.objects.filter(session_id=session_id).delete()
            # Delete the session
            session.delete()
            logger.info(f"Session {session_id} deleted by user {request.user.username}")
            return Response(
                {"message": "Session deleted successfully"},
                status=status.HTTP_200_OK
            )
        except ChatSession.DoesNotExist:
            return Response(
                {"error": "Session not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting chat session: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
