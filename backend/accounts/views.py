import requests
import re
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, login, logout
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuthUserProfile
from .models import ContactMessage, Department, Meeting, Project, Task, TeamMember
from .serializers import ContactMessageSerializer, MeetingSerializer, ProjectSerializer, TaskSerializer, TeamMemberSerializer, UserProfileSerializer


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


def normalize_person_name(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip()).casefold()


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

DEPARTMENT_MEMBER_SEEDS = {
    "technical": [
        "Mounika Vanipenta",
        "Uma Bharathi",
        "Venkateswara Rao",
        "Sriya",
        "Shakunthala",
        "Ranjith",
        "Nookaraju",
        "Charan",
    ],
    "finance": [
        "Asritha",
        "Sindhura",
        "Pawan",
        "Aneesh",
    ],
    "blockchain": [
        "Madhusree",
        "Murali",
        "Ankith",
        "Mallikarjun",
        "Avanthika",
    ],
}

PROJECT_SEEDS = [
    {
        "name": "72ipo",
        "slug": "72ipo",
        "description": "72ipo is a dummy IPO workflow project used to track issuer onboarding, compliance review, document readiness, and launch preparation.",
        "objective": "Create a clear end-to-end IPO execution flow that stakeholders can review easily inside the demo workspace.",
        "summary": "IPO readiness tracker with compliance, filing, and launch coordination workstreams.",
        "users": "Investment analysts, finance reviewers, technical coordinators, and leadership stakeholders.",
        "expected_output": "A review-ready IPO dashboard with tasks, timelines, ownership, and milestone visibility.",
        "start_date": "2026-04-01",
        "deadline": "2026-06-30",
        "status": "Active",
        "progress": 62,
    },
    {
        "name": "Midas",
        "slug": "midas",
        "description": "Midas is a dummy internal operations project focused on revenue intelligence, dashboard automation, and approval workflow visibility.",
        "objective": "Improve how teams monitor business performance through centralized reporting and structured decision checkpoints.",
        "summary": "Internal analytics and reporting workspace for pipeline, approvals, and executive insights.",
        "users": "Finance managers, delivery leads, technical owners, and project coordinators.",
        "expected_output": "A shared reporting setup with status insights, budget signals, and weekly review checkpoints.",
        "start_date": "2026-04-05",
        "deadline": "2026-07-15",
        "status": "Planning",
        "progress": 34,
    },
    {
        "name": "Realestate",
        "slug": "realestate",
        "description": "Realestate is a dummy property operations project covering listing intake, document validation, lead tracking, and portfolio updates.",
        "objective": "Organize property lifecycle activities in one place so the demo clearly shows cross-team coordination.",
        "summary": "Property management and sales-support workspace with listings, reviews, and progress tracking.",
        "users": "Operations teams, finance approvers, blockchain research teams, and client support stakeholders.",
        "expected_output": "A structured workspace for property data, approvals, marketing readiness, and launch status.",
        "start_date": "2026-04-08",
        "deadline": "2026-08-01",
        "status": "At Risk",
        "progress": 48,
    },
]

PROJECT_TASK_SEEDS = {
    "technical": {
        "72ipo": [
            {
                "title": "Collect issuer onboarding checklist",
                "description": "Prepare the complete onboarding package and confirm mandatory documents are available for review.",
                "status": "completed",
                "priority": "high",
                "due_date": "2026-04-12",
            },
            {
                "title": "Review compliance filing draft",
                "description": "Validate draft filing content, identify gaps, and circulate a review-ready version to stakeholders.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-18",
            },
            {
                "title": "Finalize launch readiness summary",
                "description": "Prepare a concise summary covering approval status, risks, and launch dependencies.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-24",
            },
        ],
        "Midas": [
            {
                "title": "Define reporting metrics",
                "description": "Lock the metrics, owners, and update cadence used for leadership reporting.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-14",
            },
            {
                "title": "Build weekly review dashboard",
                "description": "Create a dummy dashboard view for approvals, budget movement, and execution trend lines.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-21",
            },
            {
                "title": "Prepare stakeholder walkthrough",
                "description": "Draft the talking points and example screens for the project walkthrough session.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-28",
            },
        ],
        "Realestate": [
            {
                "title": "Validate property intake records",
                "description": "Review the listing intake sample and ensure all mandatory fields are populated.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-10",
            },
            {
                "title": "Update portfolio status board",
                "description": "Refresh the dummy portfolio view with active, pending, and blocked properties.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-19",
            },
            {
                "title": "Prepare client-ready summary pack",
                "description": "Create a clear summary pack covering listing status, approvals, and next actions.",
                "status": "todo",
                "priority": "low",
                "due_date": "2026-04-30",
            },
        ],
    },
    "finance": {
        "72ipo": [
            {
                "title": "Prepare IPO budget forecast",
                "description": "Create a dummy forecast covering legal spend, underwriting cost, and operating contingency.",
                "status": "completed",
                "priority": "high",
                "due_date": "2026-04-11",
            },
            {
                "title": "Review investor allocation assumptions",
                "description": "Validate capital assumptions and prepare notes for the finance review meeting.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-17",
            },
            {
                "title": "Finalize fund utilization summary",
                "description": "Summarize expected utilization buckets and approval dependencies for leadership.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-25",
            },
        ],
        "Midas": [
            {
                "title": "Reconcile revenue inputs",
                "description": "Check dummy revenue lines and align source sheets before publishing the report.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-13",
            },
            {
                "title": "Validate approval variance report",
                "description": "Review exceptions and annotate the monthly variance report for leadership.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-22",
            },
            {
                "title": "Draft finance review notes",
                "description": "Prepare a short note on margin movement, approvals, and open budget items.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-29",
            },
        ],
        "Realestate": [
            {
                "title": "Verify property cash flow sheet",
                "description": "Check dummy rental and acquisition numbers against the working finance model.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-09",
            },
            {
                "title": "Update escrow payment tracker",
                "description": "Refresh the sample escrow tracker with latest milestones and release conditions.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-20",
            },
            {
                "title": "Prepare valuation summary deck",
                "description": "Draft a finance-ready summary of property values, expected returns, and risk notes.",
                "status": "todo",
                "priority": "low",
                "due_date": "2026-04-30",
            },
        ],
    },
    "blockchain": {
        "72ipo": [
            {
                "title": "Design token governance draft",
                "description": "Prepare a dummy governance proposal aligned with the IPO-linked digital asset plan.",
                "status": "completed",
                "priority": "high",
                "due_date": "2026-04-12",
            },
            {
                "title": "Review wallet compliance flow",
                "description": "Validate onboarding flow for wallets, approvals, and audit checkpoints.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-18",
            },
            {
                "title": "Document custody architecture",
                "description": "Create a concise technical note describing storage, access, and recovery assumptions.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-24",
            },
        ],
        "Midas": [
            {
                "title": "Map on-chain analytics signals",
                "description": "Define the sample blockchain signals used in the Midas intelligence dashboard.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-14",
            },
            {
                "title": "Build smart contract event tracker",
                "description": "Create a dummy event tracking pipeline for contract activity and alert routing.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-21",
            },
            {
                "title": "Prepare staking insights summary",
                "description": "Draft a short summary showing stake movement, participation, and alert highlights.",
                "status": "todo",
                "priority": "medium",
                "due_date": "2026-04-28",
            },
        ],
        "Realestate": [
            {
                "title": "Review property tokenization model",
                "description": "Validate the dummy tokenization model for ownership units and transfer rules.",
                "status": "completed",
                "priority": "medium",
                "due_date": "2026-04-10",
            },
            {
                "title": "Update asset registry prototype",
                "description": "Refresh the sample registry workflow for property metadata and approval events.",
                "status": "inprogress",
                "priority": "high",
                "due_date": "2026-04-19",
            },
            {
                "title": "Prepare chain audit checklist",
                "description": "Document a lightweight audit checklist for the demo real estate blockchain flow.",
                "status": "todo",
                "priority": "low",
                "due_date": "2026-04-30",
            },
        ],
    },
}

PROJECT_MEETING_SEEDS = {
    "72ipo": {
        "title": "72ipo Weekly Sync",
        "agenda": "Review issuer readiness, filing dependencies, and open blockers for the current cycle.",
        "scheduled_for": "2026-04-16T10:00:00+05:30",
        "duration_minutes": 45,
        "location": "Conference Room A",
        "meeting_link": "https://meet.google.com/ipo-demo-sync",
        "status": "scheduled",
    },
    "Midas": {
        "title": "Midas Planning Review",
        "agenda": "Walk through metrics, dashboard scope, and upcoming reporting milestones.",
        "scheduled_for": "2026-04-17T14:30:00+05:30",
        "duration_minutes": 60,
        "location": "Finance War Room",
        "meeting_link": "https://meet.google.com/midas-demo-review",
        "status": "scheduled",
    },
    "Realestate": {
        "title": "Realestate Portfolio Check-in",
        "agenda": "Discuss listing validation, risk areas, and next-stage handoff planning.",
        "scheduled_for": "2026-04-18T11:30:00+05:30",
        "duration_minutes": 45,
        "location": "Hybrid",
        "meeting_link": "https://meet.google.com/realestate-demo-checkin",
        "status": "scheduled",
    },
}


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


def get_member_color(index: int) -> str:
    palette = [
        "hsl(252 82% 55%)",
        "hsl(160 72% 38%)",
        "hsl(18 90% 56%)",
        "hsl(212 85% 56%)",
        "hsl(336 78% 58%)",
        "hsl(38 92% 52%)",
        "hsl(280 70% 60%)",
        "hsl(192 72% 45%)",
    ]
    return palette[index % len(palette)]


def get_department_by_slug(slug: str):
    return Department.objects.filter(slug=slug).first()


def infer_home_department(user=None, *, email: str = "", full_name: str = ""):
    candidates = [
        email,
        full_name,
        getattr(user, "username", "") if user is not None else "",
        getattr(user, "email", "") if user is not None else "",
        user.get_full_name() if user is not None and hasattr(user, "get_full_name") else "",
    ]
    normalized = " ".join(value.strip().lower() for value in candidates if value)

    if "mounika" in normalized:
        return get_department_by_slug("technical")

    return None


@transaction.atomic
def ensure_demo_workspace_data():
    departments = ensure_default_departments()

    for department in departments:
        member_names = DEPARTMENT_MEMBER_SEEDS.get(department.slug, [])
        members = []

        if department.slug == "technical":
            TeamMember.objects.filter(department=department).exclude(name__in=member_names).delete()

        for index, name in enumerate(member_names):
            member, created = TeamMember.objects.get_or_create(
                department=department,
                name=name,
                defaults={
                    "initials": build_initials(name),
                    "color": get_member_color(index),
                },
            )
            changed_fields = []
            expected_initials = build_initials(name)
            expected_color = get_member_color(index)
            if member.initials != expected_initials:
                member.initials = expected_initials
                changed_fields.append("initials")
            if member.color != expected_color:
                member.color = expected_color
                changed_fields.append("color")
            if changed_fields and not created:
                member.save(update_fields=[*changed_fields, "updated_at"])
            members.append(member)

        for project_index, project_seed in enumerate(PROJECT_SEEDS):
            owner = members[project_index % len(members)] if members else None
            project, _ = Project.objects.update_or_create(
                department=department,
                slug=f"{project_seed['slug']}-{department.slug}",
                defaults={
                    "name": project_seed["name"],
                    "description": project_seed["description"],
                    "objective": project_seed["objective"],
                    "summary": project_seed["summary"],
                    "users": project_seed["users"],
                    "expected_output": project_seed["expected_output"],
                    "start_date": project_seed["start_date"],
                    "deadline": project_seed["deadline"],
                    "status": project_seed["status"],
                    "progress": project_seed["progress"],
                    "owner": owner,
                },
            )

            task_seeds = PROJECT_TASK_SEEDS.get(department.slug, {}).get(project_seed["name"], [])
            seeded_task_titles = [task_seed["title"] for task_seed in task_seeds]
            if department.slug in {"finance", "blockchain"}:
                Task.objects.filter(department=department, project=project).exclude(title__in=seeded_task_titles).delete()

            for task_index, task_seed in enumerate(task_seeds):
                assignee = members[(project_index + task_index) % len(members)] if members else None
                Task.objects.update_or_create(
                    department=department,
                    project=project,
                    title=task_seed["title"],
                    defaults={
                        "description": task_seed["description"],
                        "status": task_seed["status"],
                        "priority": task_seed["priority"],
                        "due_date": task_seed["due_date"],
                        "assignee": assignee,
                    },
                )

            meeting_seed = PROJECT_MEETING_SEEDS.get(project_seed["name"])
            if meeting_seed is not None:
                organizer = members[project_index % len(members)] if members else None
                meeting, _ = Meeting.objects.update_or_create(
                    department=department,
                    project=project,
                    title=meeting_seed["title"],
                    defaults={
                        "agenda": meeting_seed["agenda"],
                        "scheduled_for": meeting_seed["scheduled_for"],
                        "duration_minutes": meeting_seed["duration_minutes"],
                        "location": meeting_seed["location"],
                        "meeting_link": meeting_seed["meeting_link"],
                        "status": meeting_seed["status"],
                        "organizer": organizer,
                    },
                )
                if members:
                    attendee_count = min(3, len(members))
                    meeting.attendees.set(members[:attendee_count])


def get_home_department_for_user(user):
    departments = ensure_default_departments()
    profile = get_auth_profile(user)
    inferred_department = infer_home_department(user)
    if inferred_department is not None:
        if profile and profile.home_department_id != inferred_department.id:
            profile.home_department = inferred_department
            profile.save(update_fields=["home_department", "updated_at"])
        return inferred_department

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
    return None


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

    candidate_given_name = (profile.given_name.strip() if profile and profile.given_name else "").casefold()
    if not candidate_given_name and fallback_name:
        candidate_given_name = fallback_name.split()[0].casefold()

    if candidate_given_name:
        similar_members = list(team_member_query)
        given_name_matches = [
            member
            for member in similar_members
            if normalize_person_name(member.name).split(" ", 1)[0] == candidate_given_name
        ]
        if len(given_name_matches) == 1:
            return given_name_matches[0]

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
    home_department = infer_home_department(user, email=email, full_name=full_name) or get_home_department_for_user(user)
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


def build_auth_response(user):
    ensure_demo_workspace_data()
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
                send_mail(
                    subject=f"TaskFlow support request from {contact_message.name}",
                    message=(
                        f"Name: {contact_message.name}\n"
                        f"Email: {contact_message.email}\n\n"
                        f"Message:\n{contact_message.message}"
                    ),
                    from_email=from_email or None,
                    recipient_list=[support_email],
                    fail_silently=False,
                )
            except Exception:
                pass

        return Response(
            {
                "detail": "Message sent successfully.",
                "message": ContactMessageSerializer(contact_message).data,
            },
            status=status.HTTP_201_CREATED,
        )
