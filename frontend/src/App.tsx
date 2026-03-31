import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import { BoardPage } from "@/pages/BoardPage";
import { MeetingsPage } from "@/pages/MeetingsPage";
import { MembersPage } from "@/pages/MembersPage";
import { MemberDetailsPage } from "@/pages/MemberDetailsPage";
import { ProjectDetailsPage } from "@/pages/ProjectDetailsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { HelpPage } from "@/pages/HelpPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { TaskDialog } from "@/components/TaskDialog";
import { MemberDialog } from "@/components/MemberDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { MeetingDialog } from "@/components/MeetingDialog";
import NotFound from "./pages/NotFound";
import { api, type Meeting as ApiMeeting, type Project as ApiProject, type Task as ApiTask, type TeamMember as ApiTeamMember } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { AuthUserProvider } from "@/contexts/AuthUserContext";

type Priority = "low" | "medium" | "high";
type Status = "todo" | "inprogress" | "completed";

type Assignee = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  projectId?: string;
  assigneeId?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  summary: string;
  status: ApiProject["status"];
  progress: number;
  startDate: string;
  deadline: string;
  ownerId?: string;
};

type Meeting = {
  id: string;
  title: string;
  agenda: string;
  scheduledFor: string;
  durationMinutes: number;
  location: string;
  meetingLink: string;
  status: "scheduled" | "completed" | "cancelled";
  projectId?: string;
  organizerId?: string;
  attendeeIds: string[];
};

type Department = {
  id: number;
  name: string;
  slug: string;
  color: string;
};

function mapMember(member: ApiTeamMember): Assignee {
  return {
    id: String(member.id),
    name: member.name,
    initials: member.initials,
    color: member.color,
  };
}

function mapTask(task: ApiTask): Task {
  return {
    id: String(task.id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date ?? "",
    createdAt: task.created_at,
    projectId: task.project ? String(task.project) : undefined,
    assigneeId: task.assignee ? String(task.assignee) : undefined,
  };
}

function mapProject(project: ApiProject): Project {
  return {
    id: String(project.id),
    name: project.name,
    description: project.description,
    summary: project.summary,
    status: project.status,
    progress: project.progress,
    startDate: project.start_date ?? "",
    deadline: project.deadline ?? "",
    ownerId: project.owner ? String(project.owner) : undefined,
  };
}

const allowedProjectNames = new Map<string, string>([
  ["72ipo", "72ipo"],
  ["midas", "Midas"],
  ["realestate", "Realestate"],
]);

function normalizeProjectName(name: string) {
  return name.replace(/\s+/g, "").trim().toLowerCase();
}

function remapTaskProject(task: Task, projectIdMap: Map<string, string>) {
  if (!task.projectId) {
    return task;
  }

  return {
    ...task,
    projectId: projectIdMap.get(task.projectId),
  };
}

function remapMeetingProject(meeting: Meeting, projectIdMap: Map<string, string>) {
  if (!meeting.projectId) {
    return meeting;
  }

  return {
    ...meeting,
    projectId: projectIdMap.get(meeting.projectId),
  };
}

function mapMeeting(meeting: ApiMeeting): Meeting {
  return {
    id: String(meeting.id),
    title: meeting.title,
    agenda: meeting.agenda,
    scheduledFor: meeting.scheduled_for,
    durationMinutes: meeting.duration_minutes,
    location: meeting.location,
    meetingLink: meeting.meeting_link,
    status: meeting.status,
    projectId: meeting.project ? String(meeting.project) : undefined,
    organizerId: meeting.organizer ? String(meeting.organizer) : undefined,
    attendeeIds: meeting.attendees.map(String),
  };
}

const MEMBER_COLORS = [
  "hsl(267 84% 57%)",
  "hsl(162 63% 41%)",
  "hsl(200 70% 45%)",
  "hsl(340 65% 50%)",
  "hsl(38 92% 50%)",
  "hsl(12 80% 56%)",
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type GoogleAuthClient = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
      }) => {
        requestAccessToken: (options?: { prompt?: "consent" | "none" | "select_account" }) => void;
      };
    };
  };
};

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Assignee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [initialProjectId, setInitialProjectId] = useState<string | undefined>(undefined);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: number; username: string; home_department_id: number | null } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isClaimingTask, setIsClaimingTask] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const googleAuthInProgressRef = useRef(false);
  const canEditSelectedDepartment =
    authUser?.home_department_id == null || selectedDepartmentId == null
      ? true
      : authUser.home_department_id === selectedDepartmentId;
  const handleSelectDepartment = useCallback((departmentId: number) => {
    setIsInitialLoading(true);
    setSelectedDepartmentId(departmentId);
  }, []);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!selectedDepartmentId) {
      setIsInitialLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoadError(null);
    }

    try {
      const [tasksData, availableTasksData, membersData, projectsData, meetingsData] = await Promise.all([
        api.getTasks(selectedDepartmentId),
        api.getAvailableTasks(selectedDepartmentId),
        api.getMembers(selectedDepartmentId),
        api.getProjects(selectedDepartmentId),
        api.getMeetings(selectedDepartmentId),
      ]);

      const rawProjects = projectsData.map(mapProject);
      const canonicalProjects: Project[] = [];
      const projectIdMap = new Map<string, string>();

      rawProjects.forEach((project) => {
        const projectKey = normalizeProjectName(project.name);
        const canonicalName = allowedProjectNames.get(projectKey);

        if (!canonicalName) {
          return;
        }

        const existingProject = canonicalProjects.find(
          (entry) => normalizeProjectName(entry.name) === projectKey,
        );

        if (existingProject) {
          projectIdMap.set(project.id, existingProject.id);
          return;
        }

        const canonicalProject = {
          ...project,
          name: canonicalName,
        };

        canonicalProjects.push(canonicalProject);
        projectIdMap.set(project.id, canonicalProject.id);
      });

      setTasks(tasksData.map(mapTask).map((task) => remapTaskProject(task, projectIdMap)));
      setAvailableTasks(availableTasksData.map(mapTask).map((task) => remapTaskProject(task, projectIdMap)));
      setTeamMembers(membersData.map(mapMember));
      setProjects(canonicalProjects);
      setMeetings(meetingsData.map(mapMeeting).map((meeting) => remapMeetingProject(meeting, projectIdMap)));
    } catch (error) {
      console.error("Failed to load API data", error);
      setLoadError("Could not load workspace data. Check that the Django server is running.");
      if (options?.silent) {
        toast.error("Refresh failed");
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const session = await api.getAuthSession();
        setIsAuthenticated(session.authenticated);
        setAuthUser(session.user);
        setDepartments(session.departments);
        setSelectedDepartmentId(session.user?.home_department_id ?? session.departments[0]?.id ?? null);

        if (!session.authenticated) {
          setIsInitialLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize auth session", error);
        setLoadError("Could not connect to the workspace session. Check that the Django server is running.");
        setIsInitialLoading(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void initializeApp();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !selectedDepartmentId) {
      return;
    }

    void loadData();
  }, [isAuthenticated, loadData, selectedDepartmentId]);

  const handleNew = useCallback((projectId?: string) => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingTask(null);
    setInitialProjectId(projectId);
    setDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleNewProject = useCallback(() => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingProject(null);
    setProjectDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleEditProject = useCallback((project: Project) => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingProject(project);
    setProjectDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleNewMeeting = useCallback(() => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingMeeting(null);
    setMeetingDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleEditMeeting = useCallback((meeting: Meeting) => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingMeeting(meeting);
    setMeetingDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleEdit = useCallback((task: Task) => {
    if (!canEditSelectedDepartment) {
      toast.error("This department is view only");
      return;
    }
    setEditingTask(task);
    setInitialProjectId(undefined);
    setDialogOpen(true);
  }, [canEditSelectedDepartment]);

  const handleSave = useCallback(
    async (data: Omit<Task, "id" | "createdAt">) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      setIsSavingTask(true);
      try {
        if (editingTask) {
          await api.updateTask(Number(editingTask.id), {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            due_date: data.dueDate || null,
            project: data.projectId ? Number(data.projectId) : null,
            assignee: data.assigneeId ? Number(data.assigneeId) : null,
          }, selectedDepartmentId);
        } else {
          await api.createTask({
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            due_date: data.dueDate || null,
            project: data.projectId ? Number(data.projectId) : null,
            assignee: data.assigneeId ? Number(data.assigneeId) : null,
          }, selectedDepartmentId);
        }

        await loadData({ silent: true });
        toast.success(editingTask ? "Task updated" : "Task created");
      } catch (error) {
        console.error("Failed to save task", error);
        toast.error("Could not save task");
      } finally {
        setIsSavingTask(false);
      }
    },
    [canEditSelectedDepartment, editingTask, loadData, selectedDepartmentId],
  );

  const handleAddMember = useCallback(
    async (name: string) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      setIsSavingMember(true);
      try {
        await api.createMember({
          name,
          initials: buildInitials(name),
          color: MEMBER_COLORS[teamMembers.length % MEMBER_COLORS.length],
        }, selectedDepartmentId);

        await loadData({ silent: true });
        toast.success("Member added");
      } catch (error) {
        console.error("Failed to add member", error);
        toast.error("Could not add member");
      } finally {
        setIsSavingMember(false);
      }
    },
    [canEditSelectedDepartment, loadData, selectedDepartmentId, teamMembers.length],
  );

  const handleClaimTask = useCallback(
    async (id: string) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      setIsClaimingTask(true);
      try {
        await api.claimTask(Number(id), selectedDepartmentId);
        await loadData({ silent: true });
        toast.success("Task claimed");
      } catch (error) {
        console.error("Failed to claim task", error);
        toast.error(getErrorMessage(error, "Could not claim task"));
      } finally {
        setIsClaimingTask(false);
      }
    },
    [canEditSelectedDepartment, loadData, selectedDepartmentId],
  );

  const handleAddProject = useCallback(
    async (project: {
      name: string;
      description: string;
      summary: string;
      startDate: string;
      deadline: string;
      status: "Planning" | "Active" | "At Risk" | "Completed";
      progress: number;
      ownerId?: string;
    }) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }

      const normalizedName = normalizeProjectName(project.name);
      const canonicalName = allowedProjectNames.get(normalizedName);

      if (!canonicalName) {
        toast.error("Project name must be one of: 72ipo, Midas, Realestate");
        return;
      }

      const duplicateProject = projects.find((existingProject) => {
        if (editingProject && existingProject.id === editingProject.id) {
          return false;
        }

        return normalizeProjectName(existingProject.name) === normalizedName;
      });

      if (duplicateProject) {
        toast.error("A project with this name already exists in this department");
        return;
      }

      setIsSavingProject(true);
      try {
        const payload = {
          name: canonicalName,
          description: project.description,
          summary: project.summary,
          start_date: project.startDate || null,
          deadline: project.deadline || null,
          status: project.status,
          progress: project.progress,
          owner: project.ownerId ? Number(project.ownerId) : null,
        };

        if (editingProject) {
          await api.updateProject(Number(editingProject.id), payload, selectedDepartmentId);
        } else {
          await api.createProject(payload, selectedDepartmentId);
        }

        await loadData({ silent: true });
        toast.success(editingProject ? "Project updated" : "Project created");
      } catch (error) {
        console.error("Failed to add project", error);
        toast.error(editingProject ? "Could not update project" : "Could not create project");
      } finally {
        setIsSavingProject(false);
      }
    },
    [canEditSelectedDepartment, editingProject, loadData, projects, selectedDepartmentId],
  );

  const handleSaveMeeting = useCallback(
    async (meeting: Omit<Meeting, "id">) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      try {
        const hasConflict = meetings.some((existingMeeting) => {
          if (editingMeeting && existingMeeting.id === editingMeeting.id) {
            return false;
          }

          return (
            existingMeeting.status === "scheduled" &&
            meeting.status === "scheduled" &&
            existingMeeting.scheduledFor === meeting.scheduledFor
          );
        });

        if (hasConflict) {
          throw new Error("Another scheduled meeting already exists at this time. Choose a different time.");
        }

        setIsSavingMeeting(true);

        const payload = {
          title: meeting.title,
          agenda: meeting.agenda,
          scheduled_for: meeting.scheduledFor,
          duration_minutes: meeting.durationMinutes,
          location: meeting.location,
          meeting_link: meeting.meetingLink,
          status: meeting.status,
          project: meeting.projectId ? Number(meeting.projectId) : null,
          organizer: meeting.organizerId ? Number(meeting.organizerId) : null,
          attendees: meeting.attendeeIds.map(Number),
        };

        if (editingMeeting) {
          await api.updateMeeting(Number(editingMeeting.id), payload, selectedDepartmentId);
        } else {
          await api.createMeeting(payload, selectedDepartmentId);
        }

        await loadData({ silent: true });
        toast.success(editingMeeting ? "Meeting updated" : "Meeting scheduled");
      } catch (error) {
        console.error("Failed to save meeting", error);
        toast.error(getErrorMessage(error, editingMeeting ? "Could not update meeting" : "Could not schedule meeting"));
        throw error;
      } finally {
        setIsSavingMeeting(false);
      }
    },
    [canEditSelectedDepartment, editingMeeting, loadData, meetings, selectedDepartmentId],
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: Status) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      try {
        await api.updateTask(Number(id), { status }, selectedDepartmentId);
        await loadData({ silent: true });
      } catch (error) {
        console.error("Failed to update task status", error);
        toast.error("Could not update task status");
      }
    },
    [canEditSelectedDepartment, loadData, selectedDepartmentId],
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      if (!canEditSelectedDepartment) {
        toast.error("This department is view only");
        return;
      }
      try {
        await api.deleteTask(Number(id), selectedDepartmentId);
        await loadData({ silent: true });
        toast.success("Task deleted");
      } catch (error) {
        console.error("Failed to delete task", error);
        toast.error("Could not delete task");
      }
    },
    [canEditSelectedDepartment, loadData, selectedDepartmentId],
  );

  const handleLogout = useCallback(() => {
    const resetWorkspaceState = () => {
      setIsAuthenticated(false);
      setAuthUser(null);
      setDepartments([]);
      setSelectedDepartmentId(null);
      setTasks([]);
      setAvailableTasks([]);
      setTeamMembers([]);
      setProjects([]);
      setMeetings([]);
      setLoadError(null);
      setDialogOpen(false);
      setMemberDialogOpen(false);
      setProjectDialogOpen(false);
      setMeetingDialogOpen(false);
      setEditingTask(null);
      setEditingProject(null);
      setEditingMeeting(null);
      setInitialProjectId(undefined);
      setIsInitialLoading(false);
    };

    const logoutUser = async () => {
      try {
        await api.logout();
        resetWorkspaceState();
        toast.success("Logged out");
      } catch (error) {
        console.error("Failed to log out", error);
        resetWorkspaceState();
        toast.success("Logged out");
      }
    };

    void logoutUser();
  }, []);

  const handleLogin = useCallback(() => {
    const loginUser = async () => {
      setIsAuthLoading(true);
      setIsInitialLoading(true);
      try {
        const session = await api.loginDemo();
        setIsAuthenticated(session.authenticated);
        setAuthUser(session.user);
        setDepartments(session.departments);
        setSelectedDepartmentId(session.user?.home_department_id ?? session.departments[0]?.id ?? null);
        setLoadError(null);
        toast.success("Welcome back");
      } catch (error) {
        console.error("Failed to log in", error);
        toast.error("Could not sign in");
        setIsInitialLoading(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void loginUser();
  }, []);

  const handleGoogleLogin = useCallback(() => {
    if (googleAuthInProgressRef.current) {
      toast.error("Google sign-in is already in progress");
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!googleClientId) {
      toast.error("Missing VITE_GOOGLE_CLIENT_ID in frontend .env");
      return;
    }

    const google = (window as Window & { google?: GoogleAuthClient }).google;
    if (!google?.accounts?.oauth2) {
      toast.error("Google sign-in script is not loaded");
      return;
    }

    googleAuthInProgressRef.current = true;

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: "openid email profile",
      callback: (response) => {
        const loginWithGoogleToken = async () => {
          if (!response.access_token) {
            googleAuthInProgressRef.current = false;
            const message = response.error_description || response.error || "Google did not return access token";
            console.error("Google token client error:", response);
            toast.error(message);
            return;
          }

          setIsAuthLoading(true);
          setIsInitialLoading(true);
          try {
            const session = await api.googleTokenLogin(response.access_token);
            setIsAuthenticated(session.authenticated);
            setAuthUser(session.user);
            setDepartments(session.departments);
            setSelectedDepartmentId(session.user?.home_department_id ?? session.departments[0]?.id ?? null);
            setLoadError(null);
            toast.success("Welcome back");
          } catch (error) {
            console.error("Failed Google sign in", error);
            const message = error instanceof Error ? error.message : "Could not sign in with Google";
            toast.error(message);
            setIsInitialLoading(false);
          } finally {
            googleAuthInProgressRef.current = false;
            setIsAuthLoading(false);
          }
        };

        void loginWithGoogleToken();
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  }, []);

  return (
    <AuthUserProvider
      user={authUser}
      departments={departments}
      selectedDepartmentId={selectedDepartmentId}
      canEditSelectedDepartment={canEditSelectedDepartment}
      onSelectDepartment={handleSelectDepartment}
      onLogout={handleLogout}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
      {isAuthLoading || isInitialLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
          <div className="w-full max-w-md rounded-[1.5rem] border border-border/70 bg-white p-8 text-center shadow-[0_20px_50px_-40px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
      ) : loadError ? (
        <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] p-6">
          <div className="w-full max-w-lg rounded-[1.5rem] border border-border/70 bg-white p-8 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.18)]">
            <h1 className="text-lg font-semibold text-foreground">Workspace unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <Button className="mt-6" onClick={() => void loadData()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <BrowserRouter>
          {!isAuthenticated ? (
            <Routes>
              <Route
                path="/login"
                element={<LoginPage isLoading={isAuthLoading} onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} />}
              />
              <Route
                path="/signup"
                element={<SignupPage isLoading={isAuthLoading} onSignup={handleLogin} onGoogleLogin={handleGoogleLogin} />}
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          ) : (
            <SidebarProvider>
              <div className="app-shell flex min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_28%),linear-gradient(180deg,#f5f6fb_0%,#eef2ff_100%)] p-2 md:p-4">
                <AppSidebar
                  onAddProject={handleNewProject}
                  onAddMember={() => setMemberDialogOpen(true)}
                  onLogout={handleLogout}
                />
                <SidebarInset className="app-shell-main min-w-0 flex-1 overflow-x-auto rounded-[1.5rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(248,250,252,0.74))] shadow-[0_28px_70px_-50px_rgba(15,23,42,0.2),0_18px_40px_-34px_rgba(79,70,229,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <DashboardPage
                          tasks={tasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onEdit={handleEdit}
                          onDelete={handleDeleteTask}
                          onAddProject={handleNewProject}
                          onNew={handleNew}
                          onAddMember={() => setMemberDialogOpen(true)}
                          onScheduleMeeting={handleNewMeeting}
                        />
                      }
                    />
                    <Route
                      path="/tasks"
                      element={
                        <TasksPage
                          tasks={tasks}
                          availableTasks={availableTasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onEdit={handleEdit}
                          onDelete={handleDeleteTask}
                          onNew={handleNew}
                          onClaimTask={handleClaimTask}
                          isClaimingTask={isClaimingTask}
                        />
                      }
                    />
                    <Route
                      path="/board"
                      element={
                        <BoardPage
                          tasks={tasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onEdit={handleEdit}
                          onDelete={handleDeleteTask}
                          onNew={handleNew}
                          onUpdateStatus={handleUpdateStatus}
                        />
                      }
                    />
                    <Route
                      path="/meetings"
                      element={
                        <MeetingsPage
                          meetings={meetings}
                          tasks={tasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onAddMeeting={handleNewMeeting}
                          onEditMeeting={handleEditMeeting}
                        />
                      }
                    />
                    <Route
                      path="/projects/:projectId"
                      element={
                        <ProjectDetailsPage
                          tasks={tasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onEdit={handleEdit}
                          onNew={handleNew}
                          onEditProject={handleEditProject}
                        />
                      }
                    />
                    <Route
                      path="/members"
                      element={
                        <MembersPage
                          tasks={tasks}
                          teamMembers={teamMembers}
                          onAddMember={() => setMemberDialogOpen(true)}
                        />
                      }
                    />
                    <Route
                      path="/members/:memberId"
                      element={
                        <MemberDetailsPage
                          tasks={tasks}
                          projects={projects}
                          teamMembers={teamMembers}
                          onEdit={handleEdit}
                        />
                      }
                    />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="/signup" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </SidebarInset>
              </div>
            </SidebarProvider>
          )}
        </BrowserRouter>
      )}
      <TaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setInitialProjectId(undefined);
        }}
        onSave={handleSave}
        task={editingTask}
        teamMembers={teamMembers}
        initialProjectId={initialProjectId}
      />
      <MemberDialog
        open={memberDialogOpen && !isSavingMember}
        onClose={() => setMemberDialogOpen(false)}
        onSave={handleAddMember}
      />
      <ProjectDialog
        open={projectDialogOpen && !isSavingProject}
        onClose={() => {
          setProjectDialogOpen(false);
          setEditingProject(null);
        }}
        onSave={handleAddProject}
        teamMembers={teamMembers}
        project={editingProject}
      />
      <MeetingDialog
        open={meetingDialogOpen}
        onClose={() => {
          if (isSavingMeeting) {
            return;
          }
          setMeetingDialogOpen(false);
          setEditingMeeting(null);
        }}
        onSave={handleSaveMeeting}
        isSaving={isSavingMeeting}
        teamMembers={teamMembers}
        projects={projects}
        meeting={editingMeeting}
      />
      </TooltipProvider>
    </AuthUserProvider>
  );
};

export default App;
