from django.contrib import admin
from .models import ChatMessage, ChatSession


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ["session_id", "user", "title", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["session_id", "user__username", "title"]
    readonly_fields = ["session_id", "created_at", "updated_at"]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "created_at", "session_id"]
    list_filter = ["role", "created_at"]
    search_fields = ["user__username", "session_id", "content"]
    readonly_fields = ["created_at", "updated_at"]
