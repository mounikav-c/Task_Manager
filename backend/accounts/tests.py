from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import AuthUserProfile, Department, Task, TeamMember


class ClaimTaskTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(
            name="Technical",
            slug="technical-test",
            color="hsl(252 82% 55%)",
        )
        self.member = TeamMember.objects.create(
            name="Mounika",
            initials="M",
            color="hsl(267 84% 57%)",
            department=self.department,
        )
        self.task = Task.objects.create(
            title="Prepare onboarding checklist",
            description="",
            department=self.department,
            status="todo",
        )

        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="mounika",
            password="pass1234",
        )
        AuthUserProfile.objects.create(
            user=self.user,
            home_department=self.department,
            full_name="Mounika Vanipenta",
            given_name="Mounika",
            provider="demo",
        )
        self.client.force_authenticate(self.user)

    def test_claim_task_reuses_existing_member_with_matching_given_name(self):
        response = self.client.post(
            f"/api/tasks/{self.task.id}/claim/",
            {"department": self.department.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.task.refresh_from_db()

        self.assertEqual(self.task.assignee_id, self.member.id)
        self.assertEqual(
            TeamMember.objects.filter(department=self.department, name__iexact="Mounika").count(),
            1,
        )
        self.assertFalse(
            TeamMember.objects.filter(
                department=self.department,
                name__iexact="Mounika Vanipenta",
            ).exists()
        )
