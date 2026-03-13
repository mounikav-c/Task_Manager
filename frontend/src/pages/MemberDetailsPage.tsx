import { useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CircleDot, FolderKanban, UserRound } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Status = "todo" | "inprogress" | "completed";
type TaskFilter = "all" | "active" | "completed";

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
}

interface Props {
  tasks: Task[];
  projects: Project[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
}

function getProjectName(projectId: string | undefined, projects: Project[]) {
  return projects.find((project) => project.id === projectId)?.name ?? "No project";
}

const statusLabels: Record<Status, string> = {
  todo: "Todo",
  inprogress: "In Progress",
  completed: "Completed",
};

const priorityLabels: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not scheduled";
}

export function MemberDetailsPage({ tasks, projects, teamMembers, onEdit }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberId } = useParams();
  const member = teamMembers.find((entry) => entry.id === memberId);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const backPath = location.state?.fromPath ?? "/members";
  const backLabel = location.state?.fromLabel ?? "Members";

  const memberTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === memberId),
    [tasks, memberId],
  );

  if (!member) {
    return (
      <div className="flex h-full flex-col">
        <TopNav title="Member Details" />
        <div className="p-6">
          <div className="dashboard-panel">
            <p className="text-base font-medium text-foreground">Member not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = memberTasks.filter((task) => task.status !== "completed");
  const completedTasks = memberTasks.filter((task) => task.status === "completed");
  const overdueTasks = activeTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date());
  const projectCount = new Set(memberTasks.map((task) => task.projectId).filter(Boolean)).size;
  const orderedTasks = [...memberTasks].sort((a, b) => {
    const left = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const right = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
  const visibleTasks = orderedTasks.filter((task) => {
    if (taskFilter === "active") {
      return task.status !== "completed";
    }

    if (taskFilter === "completed") {
      return task.status === "completed";
    }

    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <TopNav title={member.name} />
      <div className="flex-1 overflow-auto p-4 md:p-5">
        <div className="mx-auto max-w-[88rem] space-y-3">
          <div>
            <Button
              variant="ghost"
              className="mb-2 h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate(backPath)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {backLabel}
            </Button>

            <section
              className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card"
              style={{ boxShadow: "var(--shadow-card-hover)" }}
            >
              <div className="bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] px-5 py-4 md:px-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(31rem,auto)] xl:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="h-14 w-14 ring-4 ring-white/90 shadow-[0_18px_45px_-24px_rgba(59,130,246,0.65)]">
                      <AvatarFallback
                        className="text-sm font-semibold text-primary-foreground"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h1 className="truncate text-[1.9rem] font-bold tracking-tight text-foreground">
                        {member.name}
                      </h1>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 backdrop-blur">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        Total Tasks
                      </div>
                      <p className="mt-1 text-lg font-semibold text-foreground">{memberTasks.length}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 backdrop-blur">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <CircleDot className="h-3.5 w-3.5 text-primary" />
                        Active
                      </div>
                      <p className="mt-1 text-lg font-semibold text-foreground">{activeTasks.length}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 backdrop-blur">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5 text-emerald-500" />
                        Completed
                      </div>
                      <p className="mt-1 text-lg font-semibold text-foreground">{completedTasks.length}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 backdrop-blur">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 text-rose-500" />
                        Overdue
                      </div>
                      <p className="mt-1 text-lg font-semibold text-foreground">{overdueTasks.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 border-t border-border/60 bg-secondary/35 px-5 py-3 md:px-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5 text-primary" />
                    Projects
                  </div>
                  <p className="mt-1.5 text-lg font-semibold text-foreground">{projectCount}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
                    Next Due
                  </div>
                  <p className="mt-1.5 text-lg font-semibold text-foreground">
                    {orderedTasks[0]?.dueDate ? formatDate(orderedTasks[0].dueDate) : "Not scheduled"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-[1.35rem] border border-border/60 bg-card p-4" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="mb-2.5 flex flex-col gap-2 border-b border-border/40 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">Assigned Tasks</h2>
              </div>
              <div className="inline-flex w-fit items-center rounded-xl border border-border/60 bg-accent/60 p-1">
                {(["all", "active", "completed"] as TaskFilter[]).map((filter) => {
                  const isActive = taskFilter === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTaskFilter(filter)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                        isActive
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {memberTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 bg-accent/50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No assigned tasks yet.</p>
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 bg-accent/50 px-5 py-6 text-center">
                <p className="text-sm font-medium text-foreground">No tasks in this view.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {visibleTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEdit(task)}
                    className="rounded-xl border border-border/60 bg-accent/35 px-4 py-3 text-left transition-all duration-200 hover:border-primary/20 hover:bg-accent/60"
                  >
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[15px] font-semibold text-foreground">{task.title}</p>
                          <span className={`status-pill status-${task.status}`}>{statusLabels[task.status]}</span>
                          <span className={`priority-pill priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <FolderKanban className="h-3.5 w-3.5" />
                            {getProjectName(task.projectId, projects)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                          </span>
                        </div>

                        {task.description && (
                          <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.125rem] text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 rounded-lg border border-border/60 bg-card px-3 py-2 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Task State
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{statusLabels[task.status]}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
