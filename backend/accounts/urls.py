from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ContactMessageView,
    MeetingViewSet,
    MessageCreateView,
    ProjectViewSet,
    TaskViewSet,
    TeamMemberViewSet,
    auth_logout,
    auth_session,
    demo_login,
    google_login,
    google_token_login,
    health_check,
    UserProfileView,
)

router = DefaultRouter()
router.register("members", TeamMemberViewSet, basename="members")
router.register("projects", ProjectViewSet, basename="projects")
router.register("tasks", TaskViewSet, basename="tasks")
router.register("meetings", MeetingViewSet, basename="meetings")

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/session/", auth_session, name="auth-session"),
    path("auth/demo-login/", demo_login, name="auth-demo-login"),
    path("auth/google/", google_login, name="auth-google-login"),
    path("auth/google/token/", google_token_login, name="auth-google-token-login"),
    path("auth/logout/", auth_logout, name="auth-logout"),
    path("auth/profile/", UserProfileView.as_view(), name="auth-profile"),
    path("contact/", ContactMessageView.as_view(), name="contact-message"),
    path("messages/", MessageCreateView.as_view(), name="message-create"),
    path("", include(router.urls)),
]
