import requests
import re
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import AuthUserProfile
from .models import Department, Meeting, Project, Task, TeamMember
from .serializers import MeetingSerializer, ProjectSerializer, TaskSerializer, TeamMemberSerializer


@api_view(["GET"])
def health_check(request):
    return Response({"message": "Backend is running"})


def generate_username_from_email(email: str) -> str:
    user_model = get_user_model()
    base = email.split("@", 1)[0].lower().strip()
    base = re.sub(r"[^a-z0-9_]+", "_", base).strip("_") or "user"
    base = base[:150]

    username = base
    suffix = 1
    while user_model.objects.filter(username=username).exists():
        token = f"_{suffix}"
        username = f"{base[:150 - len(token)]}{token}"
        suffix += 1

    return username


def build_initials(name: str) -> str:
    parts = [part for part in name.strip().split() if part]
    if not parts:
        return "NA"

    initials = "".join(part[0].upper() for part in parts[:2])
    return initials[:10]


def get_auth_profile(user):
    if not user or not getattr(user, "is_authenticated", False):
        return None

    return AuthUserProfile.objects.filter(user=user).select_related("home_department").first()


DEFAULT_DEPARTMENTS = [
    {
        "name": "Finance",
        "slug": "finance",
        "color": "hsl(160 72% 38%)",
    },
    {
        "name": "Technical",
        "slug": "technical",
        "color": "hsl(252 82% 55%)",
    },
    {
        "name": "BlockChain",
        "slug": "blockchain",
        "color": "hsl(18 90% 56%)",
    },
]


def ensure_default_departments():
    departments = []
    for item in DEFAULT_DEPARTMENTS:
        department, _ = Department.objects.get_or_create(
            slug=item["slug"],
            defaults={
                "name": item["name"],
                "color": item["color"],
            },
        )
        departments.append(department)

    return departments


def get_home_department_for_user(user):
    departments = ensure_default_departments()
    profile = get_auth_profile(user)
    if profile and profile.home_department_id:
        return profile.home_department

    if not departments:
        return None

    return departments[(user.id - 1) % len(departments)]


def get_active_department(request):
    user = request.user
    if not user or not user.is_authenticated:
        return None

    home_department = get_home_department_for_user(user)
    department_id = request.query_params.get("department")
    if not department_id:
        return home_department

    try:
        return Department.objects.get(pk=department_id)
    except Department.DoesNotExist:
        return home_department


def is_home_department_request(request):
    user = request.user
    if not user or not user.is_authenticated:
        return False

    active_department = get_active_department(request)
    home_department = get_home_department_for_user(user)
    return bool(active_department and home_department and active_department.pk == home_department.pk)


def ensure_department_is_editable(request):
    if not is_home_department_request(request):
        raise PermissionDenied("This department is view-only.")


def resolve_team_member_for_user(user, department=None):
    profile = get_auth_profile(user)
    fallback_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
    candidate_name = (
        (profile.full_name.strip() if profile and profile.full_name else "")
        or fallback_name
        or user.username
    )

    team_member_query = TeamMember.objects.filter(name__iexact=candidate_name)
    if department is not None:
        team_member_query = team_member_query.filter(department=department)

    team_member = team_member_query.order_by("id").first()
    if team_member is not None:
        return team_member

    return TeamMember.objects.create(
        name=candidate_name,
        initials=build_initials(candidate_name),
        color="hsl(252 82% 55%)",
        department=department,
    )


def get_or_create_google_user(email: str, name: str = ""):
    user_model = get_user_model()
    user = user_model.objects.filter(email__iexact=email).order_by("id").first()

    if user is None:
        username = generate_username_from_email(email)
        user = user_model.objects.create_user(username=username, email=email)
        user.set_unusable_password()
        if hasattr(user, "first_name") and name:
            user.first_name = name[:150]
            user.save(update_fields=["password", "first_name"])
        else:
            user.save(update_fields=["password"])
        return user

    update_fields = []
    if user.email != email:
        user.email = email
        update_fields.append("email")

    if hasattr(user, "first_name") and name and user.first_name != name[:150]:
        user.first_name = name[:150]
        update_fields.append("first_name")

    if update_fields:
        user.save(update_fields=update_fields)

    return user


def upsert_auth_profile(
    request,
    user,
    *,
    provider: str,
    email: str = "",
    full_name: str = "",
    given_name: str = "",
    family_name: str = "",
    picture_url: str = "",
    google_sub: str = "",
):
    home_department = get_home_department_for_user(user)
    session_key = request.session.session_key
    if not session_key:
        request.session.save()
        session_key = request.session.session_key

    session_expires_at = timezone.now() + timedelta(seconds=settings.SESSION_COOKIE_AGE)

    AuthUserProfile.objects.update_or_create(
        user=user,
        defaults={
            "provider": provider,
            "home_department": home_department,
            "email": email,
            "full_name": full_name,
            "given_name": given_name,
            "family_name": family_name,
            "picture_url": picture_url,
            "google_sub": google_sub,
            "session_id": session_key or "",
            "session_expires_at": session_expires_at,
            "last_login_at": timezone.now(),
        },
    )


@api_view(["GET"])
def auth_session(request):
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


def build_auth_response(user):
    departments = [
        {
            "id": department.id,
            "name": department.name,
            "slug": department.slug,
            "color": department.color,
        }
        for department in ensure_default_departments()
    ]
    home_department = get_home_department_for_user(user)
    return Response(
        {
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "home_department_id": home_department.id if home_department else None,
            },
            "departments": departments,
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
