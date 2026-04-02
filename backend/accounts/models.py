from django.db import models
from django.conf import settings


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(unique=True)
    color = models.CharField(max_length=50, default="hsl(252 82% 55%)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "department"

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    name = models.CharField(max_length=120)
    initials = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="team_members",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "team_member"

    def __str__(self):
        return self.name


class Project(models.Model):
    STATUS_CHOICES = [
        ("Planning", "Planning"),
        ("Active", "Active"),
        ("At Risk", "At Risk"),
        ("Completed", "Completed"),
    ]

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    objective = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    users = models.TextField(blank=True)
    expected_output = models.TextField(blank=True)

    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Planning")
    progress = models.PositiveIntegerField(default=0)

    owner = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_projects",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "project"

    def __str__(self):
        return self.name


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    STATUS_CHOICES = [
        ("todo", "Todo"),
        ("inprogress", "In Progress"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    due_date = models.DateField(null=True, blank=True)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )
    assignee = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "task"

    def __str__(self):
        return self.title


class Meeting(models.Model):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    title = models.CharField(max_length=180)
    agenda = models.TextField(blank=True)
    scheduled_for = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    location = models.CharField(max_length=180, blank=True)
    meeting_link = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="meetings",
    )
    organizer = models.ForeignKey(
        TeamMember,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organized_meetings",
    )
    attendees = models.ManyToManyField(TeamMember, blank=True, related_name="meetings")
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="meetings",
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "meeting"

    def __str__(self):
        return self.title


class AuthUserProfile(models.Model):
    PROVIDER_CHOICES = [
        ("demo", "Demo"),
        ("google", "Google"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="auth_profile",
    )
    home_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="memberships",
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="demo")
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    given_name = models.CharField(max_length=120, blank=True)
    family_name = models.CharField(max_length=120, blank=True)
    picture_url = models.URLField(blank=True)
    google_sub = models.CharField(max_length=255, blank=True)
    session_id = models.CharField(max_length=128, blank=True)
    session_expires_at = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "auth_user_profile"

    def __str__(self):
        return f"{self.user.username} ({self.provider})"


class Message(models.Model):
    conversation = models.TextField()
    sender = models.IntegerField()
    recipient = models.IntegerField(null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message"
        ordering = ["created_at", "id"]

    def __str__(self):
        return f"Message {self.pk} in conversation {self.conversation}"
