from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets

from .models import Meeting, Project, Task, TeamMember
from .serializers import MeetingSerializer, ProjectSerializer, TaskSerializer, TeamMemberSerializer


@api_view(["GET"])
def health_check(request):
    return Response({"message": "Backend is running"})


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
