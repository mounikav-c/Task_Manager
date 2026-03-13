import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import { TaskDialog } from "@/components/TaskDialog";
import { MemberDialog } from "@/components/MemberDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { MeetingDialog } from "@/components/MeetingDialog";
import NotFound from "./pages/NotFound";
import { api, type Meeting as ApiMeeting, type Project as ApiProject, type Task as ApiTask, type TeamMember as ApiTeamMember } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

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

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadError(null);
    }

    try {
      const [tasksData, membersData, projectsData, meetingsData] = await Promise.all([
        api.getTasks(),
        api.getMembers(),
        api.getProjects(),
        api.getMeetings(),
      ]);

      setTasks(tasksData.map(mapTask));
      setTeamMembers(membersData.map(mapMember));
      setProjects(projectsData.map(mapProject));
      setMeetings(meetingsData.map(mapMeeting));
    } catch (error) {
      console.error("Failed to load API data", error);
      setLoadError("Could not load workspace data. Check that the Django server is running.");
      if (options?.silent) {
        toast.error("Refresh failed");
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleNew = useCallback((projectId?: string) => {
    setEditingTask(null);
    setInitialProjectId(projectId);
    setDialogOpen(true);
  }, []);

  const handleNewProject = useCallback(() => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  }, []);

  const handleNewMeeting = useCallback(() => {
    setEditingMeeting(null);
    setMeetingDialogOpen(true);
  }, []);

  const handleEditMeeting = useCallback((meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingDialogOpen(true);
  }, []);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setInitialProjectId(undefined);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (data: Omit<Task, "id" | "createdAt">) => {
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
          });
        } else {
          await api.createTask({
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            due_date: data.dueDate || null,
            project: data.projectId ? Number(data.projectId) : null,
            assignee: data.assigneeId ? Number(data.assigneeId) : null,
          });
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
    [editingTask, loadData],
  );

  const handleAddMember = useCallback(
    async (name: string) => {
      setIsSavingMember(true);
      try {
        await api.createMember({
          name,
          initials: buildInitials(name),
          color: MEMBER_COLORS[teamMembers.length % MEMBER_COLORS.length],
        });

        await loadData({ silent: true });
        toast.success("Member added");
      } catch (error) {
        console.error("Failed to add member", error);
        toast.error("Could not add member");
      } finally {
        setIsSavingMember(false);
      }
    },
    [loadData, teamMembers.length],
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
      setIsSavingProject(true);
      try {
        const payload = {
          name: project.name,
          description: project.description,
          summary: project.summary,
          start_date: project.startDate || null,
          deadline: project.deadline || null,
          status: project.status,
          progress: project.progress,
          owner: project.ownerId ? Number(project.ownerId) : null,
        };

        if (editingProject) {
          await api.updateProject(Number(editingProject.id), payload);
        } else {
          await api.createProject(payload);
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
    [editingProject, loadData],
  );

  const handleSaveMeeting = useCallback(
    async (meeting: Omit<Meeting, "id">) => {
      setIsSavingMeeting(true);
      try {
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
          await api.updateMeeting(Number(editingMeeting.id), payload);
        } else {
          await api.createMeeting(payload);
        }

        await loadData({ silent: true });
        toast.success(editingMeeting ? "Meeting updated" : "Meeting scheduled");
      } catch (error) {
        console.error("Failed to save meeting", error);
        toast.error(editingMeeting ? "Could not update meeting" : "Could not schedule meeting");
      } finally {
        setIsSavingMeeting(false);
      }
    },
    [editingMeeting, loadData],
  );

  const handleUpdateStatus = useCallback(
    async (id: string, status: Status) => {
      try {
        await api.updateTask(Number(id), { status });
        await loadData({ silent: true });
      } catch (error) {
        console.error("Failed to update task status", error);
        toast.error("Could not update task status");
      }
    },
    [loadData],
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        await api.deleteTask(Number(id));
        await loadData({ silent: true });
        toast.success("Task deleted");
      } catch (error) {
        console.error("Failed to delete task", error);
        toast.error("Could not delete task");
      }
    },
    [loadData],
  );

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    window.location.reload();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {isInitialLoading ? (
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
          <SidebarProvider>
            <div className="app-shell flex min-h-screen w-full bg-[#f6f7fb] p-2 md:p-4">
              <AppSidebar
                onAddProject={handleNewProject}
                onAddMember={() => setMemberDialogOpen(true)}
                onLogout={handleLogout}
              />
              <SidebarInset className="app-shell-main min-w-0 flex-1 overflow-x-auto rounded-[1.5rem] border border-border/70 bg-white shadow-[0_20px_50px_-40px_rgba(15,23,42,0.18)]">
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
                        projects={projects}
                        teamMembers={teamMembers}
                        onEdit={handleEdit}
                        onDelete={handleDeleteTask}
                        onNew={handleNew}
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SidebarInset>
            </div>
          </SidebarProvider>
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
        open={meetingDialogOpen && !isSavingMeeting}
        onClose={() => {
          setMeetingDialogOpen(false);
          setEditingMeeting(null);
        }}
        onSave={handleSaveMeeting}
        teamMembers={teamMembers}
        projects={projects}
        meeting={editingMeeting}
      />
    </TooltipProvider>
  );
};

export default App;
