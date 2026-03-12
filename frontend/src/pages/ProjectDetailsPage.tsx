import { useMemo } from "react";
import { ArrowLeft, Pencil, Plus, Users } from "lucide-react";
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

const statusLabels: Record<Status, string> = {
  todo: "Todo",
  inprogress: "In Progress",
  completed: "Completed",
};

function getAssignee(id: string | undefined, teamMembers: Assignee[]) {
  return teamMembers.find((member) => member.id === id);
}

function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Not set";
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
  const team = Array.from(new Set(projectTasks.map((task) => task.assigneeId).filter(Boolean)))
    .map((memberId) => getAssignee(memberId, teamMembers))
    .filter(Boolean) as Assignee[];

  return (
    <div className="flex h-full flex-col">
      <TopNav title={project.name} />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="px-1">
            <Button variant="ghost" className="mb-4 h-8 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate("/board")}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Projects
            </Button>

            <div className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card px-6 py-5 lg:flex-row lg:items-start lg:justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="min-w-0">
                <p className="project-details-kicker">Project Details</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description}</p>
              </div>
              <div className="w-full lg:max-w-[520px]">
                <div className="mb-3 flex justify-end">
                  <Button variant="outline" className="h-9 rounded-lg text-sm" onClick={() => onEditProject(project)}>
                    <Pencil className="h-4 w-4" />
                    Edit Project
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-accent px-4 py-3">
                  <span className="project-details-label">Start Date</span>
                  <p className="project-details-value text-sm">{formatDate(project.startDate)}</p>
                </div>
                <div className="rounded-lg bg-accent px-4 py-3">
                  <span className="project-details-label">Deadline</span>
                  <p className="project-details-value text-sm">{formatDate(project.deadline)}</p>
                </div>
                <div className="rounded-lg bg-accent px-4 py-3">
                  <span className="project-details-label">Owner</span>
                  <p className="project-details-value text-sm">{owner?.name ?? "Unassigned"}</p>
                </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-border/60 bg-card px-5 py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <h2 className="text-base font-semibold text-foreground">About This Project</h2>
                <div className="mt-3 rounded-lg bg-accent px-4 py-3">
                  <span className="project-details-label">Project Explanation</span>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card px-5 py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex flex-col gap-4 border-b border-border/40 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Project Overview</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Important details in one place.</p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        {project.status}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-border/50 bg-accent px-4 py-3">
                    <span className="project-details-label">Start Date</span>
                    <p className="project-details-value text-sm">{formatDate(project.startDate)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-accent px-4 py-3">
                    <span className="project-details-label">Deadline</span>
                    <p className="project-details-value text-sm">{formatDate(project.deadline)}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-accent px-4 py-3">
                    <span className="project-details-label">Owner</span>
                    <p className="project-details-value text-sm">{owner?.name ?? "Unassigned"}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-accent px-4 py-3">
                    <span className="project-details-label">Open Tasks</span>
                    <p className="project-details-value text-sm">{projectTasks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-border/60 bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-base font-semibold">Team Members</h2>
                <p className="text-xs text-muted-foreground">People working on this project.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg bg-accent px-3 py-3">
                  <Avatar className="h-10 w-10 ring-1 ring-border/30">
                    <AvatarFallback className="text-xs font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">Assigned member</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="mb-4 flex flex-col gap-3 border-b border-border/40 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Project Tasks</h2>
                <p className="text-xs text-muted-foreground">All tasks related to this project.</p>
              </div>
              <Button className="h-9 rounded-lg text-sm bg-gradient-to-r from-primary to-primary/80" onClick={() => onNew(project.id)}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>

            {projectTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 bg-accent/50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No tasks added yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Use Add Task to create the first task.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/50">
                <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-border/40 bg-accent px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                  <span>Task</span>
                  <span>Assigned</span>
                  <span>Priority</span>
                  <span>Status</span>
                  <span>Due Date</span>
                </div>
                {projectTasks.map((task) => {
                  const assignee = getAssignee(task.assigneeId, teamMembers);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onEdit(task)}
                      className="grid w-full gap-3 border-b border-border/40 px-5 py-3 text-left transition-colors hover:bg-accent/50 last:border-b-0 md:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">{assignee?.name ?? "Unassigned"}</p>
                      </div>
                      <div className="hidden text-sm text-foreground md:block">{assignee?.name ?? "Unassigned"}</div>
                      <div>
                        <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium priority-${task.priority}`}>{task.priority}</span>
                      </div>
                      <div className="text-sm text-foreground">{statusLabels[task.status]}</div>
                      <div className="text-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
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
