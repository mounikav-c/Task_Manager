from rest_framework import serializers

from .models import AuthUserProfile, ContactMessage, Meeting, Message, Project, Task, TeamMember


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

    def validate(self, attrs):
        scheduled_for = attrs.get("scheduled_for", getattr(self.instance, "scheduled_for", None))
        status = attrs.get("status", getattr(self.instance, "status", "scheduled"))

        if scheduled_for and status == "scheduled":
            conflicts = Meeting.objects.filter(scheduled_for=scheduled_for, status="scheduled")
            if self.instance is not None:
                conflicts = conflicts.exclude(pk=self.instance.pk)

            if conflicts.exists():
                raise serializers.ValidationError(
                    {
                        "scheduled_for": "Another scheduled meeting already exists at this time. Choose a different time."
                    }
                )

        return attrs


class UserProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, allow_blank=True)
    last_name = serializers.CharField(max_length=150, allow_blank=True)
    email = serializers.EmailField(read_only=True)

    def to_representation(self, instance):
        user = instance["user"]
        profile = instance.get("profile")

        first_name = getattr(user, "first_name", "") or (profile.given_name if profile else "")
        last_name = getattr(user, "last_name", "") or (profile.family_name if profile else "")
        email = user.email or (profile.email if profile else "")

        return {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
        }

    def update(self, instance, validated_data):
        user = instance["user"]
        profile = instance.get("profile")

        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")

        changed_fields = []
        if getattr(user, "first_name", "") != first_name:
            user.first_name = first_name
            changed_fields.append("first_name")
        if getattr(user, "last_name", "") != last_name:
            user.last_name = last_name
            changed_fields.append("last_name")

        if changed_fields:
            user.save(update_fields=changed_fields)

        full_name = " ".join(part for part in [first_name, last_name] if part).strip()
        profile_defaults = {
            "provider": profile.provider if profile else "demo",
            "email": user.email or (profile.email if profile else ""),
            "full_name": full_name,
            "given_name": first_name,
            "family_name": last_name,
            "home_department": profile.home_department if profile else None,
            "picture_url": profile.picture_url if profile else "",
            "google_sub": profile.google_sub if profile else "",
            "session_id": profile.session_id if profile else "",
            "session_expires_at": profile.session_expires_at if profile else None,
            "last_login_at": profile.last_login_at if profile else None,
        }

        AuthUserProfile.objects.update_or_create(user=user, defaults=profile_defaults)
        refreshed_profile = AuthUserProfile.objects.filter(user=user).first()
        return {"user": user, "profile": refreshed_profile}


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


class DirectMessageTeamMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    name = serializers.CharField()
    initials = serializers.CharField()
    color = serializers.CharField()
    email = serializers.EmailField(allow_blank=True)
    unread_count = serializers.IntegerField()
    last_message_at = serializers.DateTimeField(allow_null=True)

class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)
    receiver_id = serializers.IntegerField(source="recipient_id", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "sender_conversation",
            "receiver_conversation",
            "sender_id",
            "receiver_id",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender_id", "receiver_id", "is_read", "created_at"]


class MessageCreateSerializer(serializers.Serializer):
    sender_id = serializers.IntegerField()
    receiver_id = serializers.IntegerField()
    sender_conversation = serializers.CharField(allow_blank=False, trim_whitespace=True)
    receiver_conversation = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)
