from rest_framework import serializers
from .models import ChatMessage, ChatSession


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "session_id", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ["id", "session_id", "title", "messages", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def get_messages(self, obj):
        """Fetch messages filtered by this specific session_id only."""
        messages = ChatMessage.objects.filter(
            session_id=obj.session_id
        ).order_by("created_at")
        return ChatMessageSerializer(messages, many=True).data


class ChatRequestSerializer(serializers.Serializer):
    """Serializer for chat request"""
    message = serializers.CharField(max_length=5000)
    session_id = serializers.CharField(max_length=255, required=False, allow_blank=True)


class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat response"""
    session_id = serializers.CharField()
    user_message = serializers.CharField()
    assistant_response = serializers.CharField()
    meeting_scheduled = serializers.BooleanField(default=False)
    meeting_details = serializers.JSONField(required=False, allow_null=True)
