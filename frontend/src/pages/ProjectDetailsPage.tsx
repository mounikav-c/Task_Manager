import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FolderKanban,
  ListTodo,
  Pencil,
  Plus,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Status = "todo" | "inprogress" | "completed";

interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
  projectId?: string;
  assigneeId?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  summary: string;
  status: "Planning" | "Active" | "At Risk" | "Completed";
  progress: number;
  startDate: string;
  deadline: string;
  ownerId?: string;
}

interface Props {
  tasks: Task[];
  projects: Project[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onNew: (projectId?: string) => void;
  onEditProject: (project: Project) => void;
}

const taskStatusLabels: Record<Status, string> = {
  todo: "Todo",
  inprogress: "In Progress",
  completed: "Completed",
};

const projectStatusTone: Record<Project["status"], string> = {
  Planning: "border-slate-300 bg-slate-100 text-slate-700",
  Active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  "At Risk": "border-amber-300 bg-amber-50 text-amber-700",
  Completed: "border-violet-300 bg-violet-50 text-violet-700",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function getAssignee(id: string | undefined, teamMembers: Assignee[]) {
  return teamMembers.find((member) => member.id === id);
}

function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Not set";
}

function buildProjectOverview(project: Project) {
  const summary = project.summary.trim().replace(/\s+/g, " ");
  const description = project.description.trim().replace(/\s+/g, " ");

  return [
    summary || `${project.name} is an active project in this workspace.`,
    description && description !== summary
      ? description
      : "This page gives a clear view of the project goal, ownership, timeline, and current work.",
  ];
}

export function ProjectDetailsPage({ tasks, projects, teamMembers, onEdit, onNew, onEditProject }: Props) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = projects.find((entry) => entry.id === projectId);

  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === projectId),
    [tasks, projectId],
  );

  if (!project) {
    return (
      <div className="flex h-full flex-col">
        <TopNav title="Project Details" />
        <div className="p-6">
          <div className="dashboard-panel">
            <p className="text-base font-medium text-foreground">Project not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const owner = getAssignee(project.ownerId, teamMembers);
  const activeTasks = projectTasks.filter((task) => task.status !== "completed");
  const team = Array.from(new Set(projectTasks.map((task) => task.assigneeId).filter(Boolean)))
    .map((memberId) => getAssignee(memberId, teamMembers))
    .filter(Boolean) as Assignee[];
  const overviewLines = buildProjectOverview(project);
  const sortedTasks = [...projectTasks].sort((a, b) => {
    const left = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const right = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return left - right;
  });

  const statCards = [
    { label: "Start Date", value: formatDate(project.startDate), icon: CalendarDays },
    { label: "Deadline", value: formatDate(project.deadline), icon: CalendarDays },
    { label: "Owner", value: owner?.name ?? "Unassigned", icon: UserRound },
    { label: "Open Tasks", value: String(activeTasks.length), icon: ListTodo },
  ];

  return (
    <div className="flex h-full flex-col">
      <TopNav title={project.name} />
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <div className="mx-auto flex min-h-full max-w-[108rem] flex-col gap-3">
          <div>
            <Button
              variant="ghost"
              className="mb-2 h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/board")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Button>

            <section
              className="rounded-[1.15rem] border border-border/70 bg-card px-4 py-3.5 transition-shadow duration-200 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.32)]"
              style={{ boxShadow: "0 10px 30px -28px rgba(15,23,42,0.28)" }}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[1.9rem] font-bold tracking-tight text-foreground">{project.name}</h1>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${projectStatusTone[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-border/70 bg-white px-4 text-sm font-medium transition-all duration-200 hover:border-primary/25 hover:bg-primary/5"
                  onClick={() => onEditProject(project)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Project
                </Button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/60 bg-accent/45 px-3 py-2.5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/20 hover:bg-accent/70"
                    style={{ boxShadow: "0 8px 20px -24px rgba(15,23,42,0.25)" }}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <stat.icon className="h-3.5 w-3.5 text-primary" />
                      {stat.label}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <section
              className="rounded-[1.15rem] border border-border/60 bg-card px-4 py-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="text-lg font-semibold tracking-tight text-foreground">About This Project</h2>
              <div className="mt-2 rounded-xl bg-accent/45 px-4 py-3">
                <div className="space-y-1.5 text-sm leading-6 text-foreground/82">
                  {overviewLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="rounded-[1.15rem] border border-border/60 bg-card px-4 py-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Progress</h2>
                <span className="text-sm font-semibold text-foreground">{project.progress}%</span>
              </div>
              <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-fuchsia-500/90 to-violet-400 transition-[width] duration-1000"
                  style={{
                    width: `${project.progress}%`,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {team.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members assigned yet.</p>
                ) : (
                  team.map((member) => (
                    <div
                      key={member.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-accent/45 px-2.5 py-1.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:bg-accent/70 hover:shadow-[0_12px_24px_-20px_rgba(15,23,42,0.3)]"
                    >
                      <Avatar className="h-7 w-7 ring-1 ring-border/30">
                        <AvatarFallback className="text-[10px] font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{member.name}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section
            className="flex-1 rounded-[1.15rem] border border-border/60 bg-card p-3.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_rgba(15,23,42,0.28)]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-2.5 flex flex-col gap-2 border-b border-border/40 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Project Tasks</h2>
              <Button
                className="h-10 rounded-xl bg-gradient-to-r from-primary via-fuchsia-500/95 to-violet-500 px-4 text-sm font-medium text-primary-foreground shadow-[0_18px_35px_-20px_hsl(var(--primary)/0.85)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-22px_hsl(var(--primary)/0.9)] hover:brightness-105"
                onClick={() => onNew(project.id)}
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>

            {projectTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-accent/40 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No tasks added yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Use Add Task to create the first task.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {sortedTasks.map((task) => {
                  const assignee = getAssignee(task.assigneeId, teamMembers);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onEdit(task)}
                      className="rounded-xl border border-border/60 bg-accent/35 px-3.5 py-2.5 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/20 hover:bg-accent/65 hover:shadow-[0_18px_30px_-26px_rgba(15,23,42,0.35)]"
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-[15px] font-semibold text-foreground">{task.title}</p>
                            <span className={`status-pill status-${task.status}`}>{taskStatusLabels[task.status]}</span>
                            <span className={`priority-pill priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                            <span>{assignee?.name ?? "Unassigned"}</span>
                            <span className="text-border">&bull;</span>
                            <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                          </div>
                          {task.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-[1.125rem] text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <span className={`status-pill status-${task.status} shrink-0`}>
                          {taskStatusLabels[task.status]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
