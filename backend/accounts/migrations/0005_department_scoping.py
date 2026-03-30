from django.db import migrations, models
import django.db.models.deletion


DEFAULT_DEPARTMENTS = [
    ("engineering", "Engineering", "hsl(252 82% 55%)"),
    ("operations", "Operations", "hsl(160 72% 38%)"),
    ("marketing", "Marketing", "hsl(18 90% 56%)"),
]


def seed_departments(apps, schema_editor):
    Department = apps.get_model("accounts", "Department")
    TeamMember = apps.get_model("accounts", "TeamMember")
    Project = apps.get_model("accounts", "Project")
    Task = apps.get_model("accounts", "Task")
    Meeting = apps.get_model("accounts", "Meeting")
    AuthUserProfile = apps.get_model("accounts", "AuthUserProfile")

    departments = []
    for slug, name, color in DEFAULT_DEPARTMENTS:
        department, _ = Department.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "color": color},
        )
        departments.append(department)

    primary_department = departments[0]

    TeamMember.objects.filter(department__isnull=True).update(department=primary_department)
    Project.objects.filter(department__isnull=True).update(department=primary_department)
    Task.objects.filter(department__isnull=True).update(department=primary_department)
    Meeting.objects.filter(department__isnull=True).update(department=primary_department)

    profiles = AuthUserProfile.objects.filter(home_department__isnull=True)
    for profile in profiles.iterator():
        department = departments[(profile.user_id - 1) % len(departments)]
        profile.home_department = department
        profile.save(update_fields=["home_department"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_authuserprofile_session_expires_at_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Department",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("slug", models.SlugField(unique=True)),
                ("color", models.CharField(default="hsl(252 82% 55%)", max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="authuserprofile",
            name="home_department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="memberships", to="accounts.department"),
        ),
        migrations.AddField(
            model_name="meeting",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="meetings", to="accounts.department"),
        ),
        migrations.AddField(
            model_name="project",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="projects", to="accounts.department"),
        ),
        migrations.AddField(
            model_name="task",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="tasks", to="accounts.department"),
        ),
        migrations.AddField(
            model_name="teammember",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="team_members", to="accounts.department"),
        ),
        migrations.RunPython(seed_departments, migrations.RunPython.noop),
    ]
