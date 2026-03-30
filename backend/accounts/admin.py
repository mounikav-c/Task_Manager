from django.contrib import admin

from .models import AuthUserProfile, Department, Meeting, Project, Task, TeamMember


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "color", "created_at")
    search_fields = ("name", "slug")


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "department", "initials", "color", "created_at")
    search_fields = ("name", "initials")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "department", "slug", "status", "progress", "owner", "deadline")
    search_fields = ("name", "slug")
    list_filter = ("status",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "department", "status", "priority", "project", "assignee", "due_date")
    search_fields = ("title", "description")
    list_filter = ("status", "priority", "project")


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "department", "scheduled_for", "status", "project", "organizer")
    search_fields = ("title", "agenda", "location")
    list_filter = ("status", "project")
    filter_horizontal = ("attendees",)


@admin.register(AuthUserProfile)
class AuthUserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "home_department",
        "provider",
        "email",
        "full_name",
        "google_sub",
        "session_id",
        "session_expires_at",
        "last_login_at",
        "updated_at",
    )
    search_fields = ("user__username", "email", "full_name", "google_sub")
    list_filter = ("provider", "home_department")
