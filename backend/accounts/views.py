import requests
import re
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import AuthUserProfile
from .models import Meeting, Project, Task, TeamMember
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
    session_key = request.session.session_key
    if not session_key:
        request.session.save()
        session_key = request.session.session_key

    session_expires_at = timezone.now() + timedelta(seconds=settings.SESSION_COOKIE_AGE)

    AuthUserProfile.objects.update_or_create(
        user=user,
        defaults={
            "provider": provider,
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
    upsert_auth_profile(
        request,
        user,
        provider="demo",
        email=user.email or "",
        full_name=user.get_full_name() or user.username,
    )
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
