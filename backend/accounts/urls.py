from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MeetingViewSet, ProjectViewSet, TaskViewSet, TeamMemberViewSet, health_check

router = DefaultRouter()
router.register("members", TeamMemberViewSet, basename="members")
router.register("projects", ProjectViewSet, basename="projects")
router.register("tasks", TaskViewSet, basename="tasks")
router.register("meetings", MeetingViewSet, basename="meetings")

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("", include(router.urls)),
]
