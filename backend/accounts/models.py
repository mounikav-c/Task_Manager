from django.db import models


class TeamMember(models.Model):
    name = models.CharField(max_length=120)
    initials = models.CharField(max_length=10)
    color = models.CharField(max_length=50)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_for", "title"]

    def __str__(self):
        return self.title
