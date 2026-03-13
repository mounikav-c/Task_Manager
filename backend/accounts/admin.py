from django.contrib import admin

from .models import Meeting, Project, Task, TeamMember


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "initials", "color", "created_at")
    search_fields = ("name", "initials")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "status", "progress", "owner", "deadline")
    search_fields = ("name", "slug")
    list_filter = ("status",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "priority", "project", "assignee", "due_date")
    search_fields = ("title", "description")
    list_filter = ("status", "priority", "project")


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "scheduled_for", "status", "project", "organizer")
    search_fields = ("title", "agenda", "location")
    list_filter = ("status", "project")
    filter_horizontal = ("attendees",)
