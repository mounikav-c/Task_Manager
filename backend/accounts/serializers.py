from rest_framework import serializers

from .models import Meeting, Project, Task, TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ["id", "name", "initials", "color", "created_at", "updated_at"]


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.name", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "objective",
            "summary",
            "users",
            "expected_output",
            "start_date",
            "deadline",
            "status",
            "progress",
            "owner",
            "owner_name",
            "created_at",
            "updated_at",
        ]


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source="assignee.name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "project",
            "project_name",
            "assignee",
            "assignee_name",
            "created_at",
            "updated_at",
        ]


class MeetingSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    organizer_name = serializers.CharField(source="organizer.name", read_only=True)
    attendee_details = TeamMemberSerializer(source="attendees", many=True, read_only=True)
    attendees = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TeamMember.objects.all(),
        required=False,
    )

    class Meta:
        model = Meeting
        fields = [
            "id",
            "title",
            "agenda",
            "scheduled_for",
            "duration_minutes",
            "location",
            "meeting_link",
            "status",
            "project",
            "project_name",
            "organizer",
            "organizer_name",
            "attendees",
            "attendee_details",
            "created_at",
            "updated_at",
        ]
