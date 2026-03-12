from rest_framework import serializers

from .models import Project, Task, TeamMember


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
done