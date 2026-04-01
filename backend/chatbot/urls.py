from django.urls import path
from .views import ChatView, ChatHistoryView, ChatSessionListView, ChatSessionDeleteView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("sessions/", ChatSessionListView.as_view(), name="chat-sessions"),
    path("sessions/<str:session_id>/", ChatHistoryView.as_view(), name="chat-history"),
    path("sessions/<str:session_id>/delete/", ChatSessionDeleteView.as_view(), name="delete-session"),
]
