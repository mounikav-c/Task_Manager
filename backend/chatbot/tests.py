from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import TeamMember, Department
from .models import ChatMessage, ChatSession
from .agent import MeetingSchedulerAgent

User = get_user_model()


class ChatbotTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create department
        self.dept = Department.objects.create(
            name="Engineering",
            slug="engineering",
            color="hsl(252 82% 55%)"
        )
        
        # Create team members
        self.member1 = TeamMember.objects.create(
            name="John Doe",
            initials="JD",
            color="hsl(0 84% 60%)",
            department=self.dept
        )
        
        self.member2 = TeamMember.objects.create(
            name="Jane Smith",
            initials="JS",
            color="hsl(160 72% 38%)",
            department=self.dept
        )
        
        # Create user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
    
    def test_chat_session_creation(self):
        """Test creating a chat session"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id="test-session-123",
            title="Test Session"
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.session_id, "test-session-123")
    
    def test_chat_message_creation(self):
        """Test creating a chat message"""
        message = ChatMessage.objects.create(
            user=self.user,
            role="user",
            content="Schedule a meeting with John Doe",
            session_id="test-session-123"
        )
        self.assertEqual(message.role, "user")
        self.assertEqual(message.user, self.user)
    
    def test_agent_initialization(self):
        """Test agent initialization"""
        agent = MeetingSchedulerAgent(self.user)
        self.assertIsNotNone(agent.graph)
        self.assertEqual(agent.user, self.user)
