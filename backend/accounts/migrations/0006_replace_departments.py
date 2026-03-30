from django.db import migrations


NEW_DEPARTMENTS = [
    ("finance", "Finance", "hsl(160 72% 38%)"),
    ("technical", "Technical", "hsl(252 82% 55%)"),
    ("blockchain", "BlockChain", "hsl(18 90% 56%)"),
]

OLD_TO_NEW_SLUG = {
    "engineering": "technical",
    "operations": "finance",
    "marketing": "blockchain",
}


def replace_departments(apps, schema_editor):
    Department = apps.get_model("accounts", "Department")
    TeamMember = apps.get_model("accounts", "TeamMember")
    Project = apps.get_model("accounts", "Project")
    Task = apps.get_model("accounts", "Task")
    Meeting = apps.get_model("accounts", "Meeting")
    AuthUserProfile = apps.get_model("accounts", "AuthUserProfile")

    created_departments = {}
    for slug, name, color in NEW_DEPARTMENTS:
        department, _ = Department.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "color": color},
        )
        if department.name != name or department.color != color:
            department.name = name
            department.color = color
            department.save(update_fields=["name", "color"])
        created_departments[slug] = department

    for old_slug, new_slug in OLD_TO_NEW_SLUG.items():
        old_department = Department.objects.filter(slug=old_slug).first()
        new_department = created_departments[new_slug]
        if old_department is None or old_department.pk == new_department.pk:
            continue

        TeamMember.objects.filter(department=old_department).update(department=new_department)
        Project.objects.filter(department=old_department).update(department=new_department)
        Task.objects.filter(department=old_department).update(department=new_department)
        Meeting.objects.filter(department=old_department).update(department=new_department)
        AuthUserProfile.objects.filter(home_department=old_department).update(home_department=new_department)
        old_department.delete()

    valid_ids = [department.id for department in created_departments.values()]
    fallback_department = created_departments["technical"]

    TeamMember.objects.exclude(department_id__in=valid_ids).update(department=fallback_department)
    Project.objects.exclude(department_id__in=valid_ids).update(department=fallback_department)
    Task.objects.exclude(department_id__in=valid_ids).update(department=fallback_department)
    Meeting.objects.exclude(department_id__in=valid_ids).update(department=fallback_department)
    AuthUserProfile.objects.exclude(home_department_id__in=valid_ids).update(home_department=fallback_department)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_department_scoping"),
    ]

    operations = [
        migrations.RunPython(replace_departments, migrations.RunPython.noop),
    ]
