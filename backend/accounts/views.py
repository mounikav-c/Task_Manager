import requests

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.mail import EmailMessage
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .helpers.taskdashboard import build_auth_response
from .helpers.taskdashboard import ensure_default_departments
from .helpers.taskdashboard import ensure_demo_workspace_data
from .helpers.taskdashboard import ensure_department_is_editable
from .helpers.taskdashboard import get_active_department
from .helpers.taskdashboard import get_auth_profile
from .helpers.taskdashboard import get_home_department_for_user
from .helpers.taskdashboard import get_or_create_google_user
from .helpers.taskdashboard import infer_home_department
from .helpers.taskdashboard import is_home_department_request
from .helpers.taskdashboard import resolve_team_member_for_user
from .helpers.taskdashboard import upsert_auth_profile
from .models import ContactMessage, Department, Meeting, Project, Task, TeamMember
from .serializers import ContactMessageSerializer, MeetingSerializer, ProjectSerializer, TaskSerializer, TeamMemberSerializer, UserProfileSerializer


@api_view(["GET"])
def health_check(request):
    return Response({"message": "Backend is running"})


@ensure_csrf_cookie
@api_view(["GET"])
def auth_session(request):
    ensure_demo_workspace_data()
    user = request.user
    departments = [
        {
            "id": department.id,
            "name": department.name,
            "slug": department.slug,
            "color": department.color,
        }
        for department in ensure_default_departments()
    ]
    home_department = get_home_department_for_user(user) if user and user.is_authenticated else None
    return Response(
        {
            "authenticated": bool(user and user.is_authenticated),
            "user": {
                "id": user.id,
                "username": user.username,
                "home_department_id": home_department.id if home_department else None,
            }
            if user and user.is_authenticated
            else None,
            "departments": departments if user and user.is_authenticated else [],
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
    upsert_auth_profile(
        request,
        user,
        provider="demo",
        email=user.email or "",
        full_name=user.get_full_name() or user.username,
    )
    return build_auth_response(user)



@csrf_exempt
@api_view(["POST"])
def google_login(request):
    token = request.data.get("id_token")

    if not token:
        return Response({"detail": "id_token is required"}, status=400)

    try:
        payload = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception as exc:
        return Response({"detail": f"Invalid Google token: {str(exc)}"}, status=400)

    email = payload.get("email")
    if not email:
        return Response({"detail": "Google account email not available"}, status=400)
    name = payload.get("name", "")
    google_sub = payload.get("sub", "")

    user = get_or_create_google_user(email=email, name=name)

    login(request, user)
    upsert_auth_profile(
        request,
        user,
        provider="google",
        email=email,
        full_name=name,
        given_name=payload.get("given_name", ""),
        family_name=payload.get("family_name", ""),
        picture_url=payload.get("picture", ""),
        google_sub=google_sub,
    )

    return build_auth_response(user)


@csrf_exempt
@api_view(["POST"])
def google_token_login(request):
    access_token = request.data.get("access_token")

    if not access_token:
        return Response({"detail": "access_token is required"}, status=400)

    try:
        profile_response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        profile_response.raise_for_status()
        profile = profile_response.json()
    except Exception as exc:
        return Response({"detail": f"Failed to fetch Google profile: {str(exc)}"}, status=400)

    email = profile.get("email")
    if not email:
        return Response({"detail": "Google account email not available"}, status=400)
    name = profile.get("name", "")
    google_sub = profile.get("sub", "")

    user = get_or_create_google_user(email=email, name=name)

    login(request, user)
    upsert_auth_profile(
        request,
        user,
        provider="google",
        email=email,
        full_name=name,
        given_name=profile.get("given_name", ""),
        family_name=profile.get("family_name", ""),
        picture_url=profile.get("picture", ""),
        google_sub=google_sub,
    )

    return build_auth_response(user)


@csrf_exempt
@api_view(["POST"])
def auth_logout(request):
    logout(request)
    return Response({"authenticated": False})


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        active_department = get_active_department(self.request)
        if active_department is None:
            return queryset.none()
        return queryset.filter(department=active_department)

    def perform_create(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save(department=get_active_department(self.request))

    def perform_update(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_department_is_editable(self.request)
        instance.delete()


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        active_department = get_active_department(self.request)
        if active_department is None:
            return queryset.none()
        return queryset.filter(department=active_department)

    def perform_create(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save(department=get_active_department(self.request))

    def perform_update(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_department_is_editable(self.request)
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related("project", "assignee").all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        active_department = get_active_department(self.request)
        if active_department is None:
            return queryset.none()
        return queryset.filter(department=active_department)

    def perform_create(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save(department=get_active_department(self.request))

    def perform_update(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_department_is_editable(self.request)
        instance.delete()

    @action(detail=False, methods=["get"], url_path="available")
    def available_tasks(self, request):
        available_tasks = self.get_queryset().filter(assignee__isnull=True)
        serializer = self.get_serializer(available_tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="claim")
    def claim_task(self, request, pk=None):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        if not is_home_department_request(request):
            return Response({"detail": "This department is view-only."}, status=status.HTTP_403_FORBIDDEN)

        task = self.get_object()
        if task.assignee_id is not None:
            return Response({"detail": "This task has already been claimed."}, status=status.HTTP_400_BAD_REQUEST)

        team_member = resolve_team_member_for_user(request.user, department=task.department)
        task.assignee = team_member
        task.status = "inprogress"
        task.save(update_fields=["assignee", "status", "updated_at"])

        serializer = self.get_serializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.select_related("project", "organizer").prefetch_related("attendees").all()
    serializer_class = MeetingSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        active_department = get_active_department(self.request)
        if active_department is None:
            return queryset.none()
        return queryset.filter(department=active_department)

    def perform_create(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save(department=get_active_department(self.request))

    def perform_update(self, serializer):
        ensure_department_is_editable(self.request)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_department_is_editable(self.request)
        instance.delete()


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_auth_profile(request.user)
        serializer = UserProfileSerializer({"user": request.user, "profile": profile})
        return Response(serializer.data)

    def patch(self, request):
        profile = get_auth_profile(request.user)
        serializer = UserProfileSerializer(
            {"user": request.user, "profile": profile},
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return Response(UserProfileSerializer(payload).data)


class ContactMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact_message = serializer.save(user=request.user)

        support_email = getattr(settings, "CONTACT_SUPPORT_EMAIL", "").strip()
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "").strip()

        if support_email:
            try:
                email = EmailMessage(
                    subject=f"TaskFlow support request from {contact_message.name}",
                    body=(
                        f"Name: {contact_message.name}\n"
                        f"Email: {contact_message.email}\n\n"
                        f"Message:\n{contact_message.message}"
                    ),
                    from_email=from_email or None,
                    to=[support_email],
                    reply_to=[contact_message.email],
                )
                email.send(fail_silently=False)
            except Exception as exc:
                return Response(
                    {
                        "detail": "Message was saved, but the support email could not be delivered.",
                        "error": str(exc),
                        "message": ContactMessageSerializer(contact_message).data,
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        return Response(
            {
                "detail": "Message sent successfully.",
                "message": ContactMessageSerializer(contact_message).data,
            },
            status=status.HTTP_201_CREATED,
        )
