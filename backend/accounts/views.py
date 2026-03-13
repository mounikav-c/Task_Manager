from django.contrib.auth import get_user_model, login, logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets

from .models import Meeting, Project, Task, TeamMember
from .serializers import MeetingSerializer, ProjectSerializer, TaskSerializer, TeamMemberSerializer


@api_view(["GET"])
def health_check(request):
    return Response({"message": "Backend is running"})


@api_view(["GET"])
def auth_session(request):
    user = request.user
    return Response(
        {
            "authenticated": bool(user and user.is_authenticated),
            "user": {
                "id": user.id,
                "username": user.username,
            }
            if user and user.is_authenticated
            else None,
        }
    )


@csrf_exempt
@api_view(["POST"])
def demo_login(request):
    User = get_user_model()
    user = User.objects.filter(is_active=True).order_by("id").first()

    if user is None:
        user = User.objects.create_user(username="workspace")

    login(request, user)
    return Response(
        {
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
            },
        }
    )


@csrf_exempt
@api_view(["POST"])
def auth_logout(request):
    logout(request)
    return Response({"authenticated": False})


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("project", "assignee").all()
    serializer_class = TaskSerializer


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.select_related("project", "organizer").prefetch_related("attendees").all()
    serializer_class = MeetingSerializer
