import { AlertTriangle, Clock3, ListChecks, Plus, X } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Assignee, Status, Task } from "@/lib/store";
import { getProjectById, PROJECTS } from "@/lib/projects";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

interface Props {
  tasks: Task[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function TasksPage({ tasks, teamMembers, onEdit, onDelete, onNew }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const assigneeFilter = searchParams.get("assignee") || "all";
  const projectFilter = searchParams.get("project") || "all";
  const today = new Date().toISOString().split("T")[0];
  const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
  const statusWeight: Record<Status, number> = { inprogress: 0, todo: 1, completed: 2 };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filter === "completed") result = result.filter((t) => t.status === "completed");
    else if (filter === "pending") result = result.filter((t) => t.status === "todo" || t.status === "inprogress");
    else if (filter === "overdue") result = result.filter((t) => t.dueDate < today && t.status !== "completed");

    if (assigneeFilter !== "all") result = result.filter((t) => t.assigneeId === assigneeFilter);
    if (projectFilter !== "all") result = result.filter((t) => t.projectId === projectFilter);

    return [...result].sort((a, b) => {
      const overdueDelta = Number(a.dueDate < today && a.status !== "completed") - Number(b.dueDate < today && b.status !== "completed");
      if (overdueDelta !== 0) return overdueDelta * -1;

      const statusDelta = statusWeight[a.status] - statusWeight[b.status];
      if (statusDelta !== 0) return statusDelta;

      const priorityDelta = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDelta !== 0) return priorityDelta;

      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, filter, assigneeFilter, projectFilter, today]);

  const summary = useMemo(() => {
    const overdue = filteredTasks.filter((task) => task.dueDate < today && task.status !== "completed");
    const dueSoon = filteredTasks.filter((task) => {
      const distance = Math.ceil((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000);
      return distance >= 0 && distance <= 3 && task.status !== "completed";
    });
    const inProgress = filteredTasks.filter((task) => task.status === "inprogress");

    return { overdue, dueSoon, inProgress };
  }, [filteredTasks, today]);

  const memberWorkload = useMemo(() => {
    return teamMembers
      .map((member) => {
        const assigned = filteredTasks.filter((task) => task.assigneeId === member.id);
        const overdue = assigned.filter((task) => task.dueDate < today && task.status !== "completed").length;
        const inProgress = assigned.filter((task) => task.status === "inprogress").length;

        return {
          member,
          total: assigned.length,
          overdue,
          inProgress,
          nextTask: assigned[0],
        };
      })
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.overdue - a.overdue || b.inProgress - a.inProgress || b.total - a.total);
  }, [filteredTasks, teamMembers, today]);

  const focusTasks = useMemo(() => filteredTasks.slice(0, 4), [filteredTasks]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const hasFilters = filter !== "all" || assigneeFilter !== "all" || projectFilter !== "all";
  const filterLabel = { all: "All", completed: "Completed", pending: "Pending", overdue: "Overdue" }[filter] || "All";
  const summaryCards = [
    {
      label: "Visible Tasks",
      value: filteredTasks.length,
      note: projectFilter === "all" ? "Across every project" : getProjectById(projectFilter)?.name ?? "Project view",
      icon: ListChecks,
      tone: "text-primary",
    },
    {
      label: "Overdue",
      value: summary.overdue.length,
      note: "Needs action first",
      icon: AlertTriangle,
      tone: "text-rose-400",
    },
    {
      label: "Due Soon",
      value: summary.dueSoon.length,
      note: "Due in the next 3 days",
      icon: Clock3,
      tone: "text-amber-400",
    },
    {
      label: "In Progress",
      value: summary.inProgress.length,
      note: "Currently being worked on",
      icon: ListChecks,
      tone: "text-emerald-400",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Tasks" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Global Task Queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track work across all projects by urgency, owner, and status.</p>
          </div>
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="stat-card">
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
                </div>
                <div className={`stat-card-icon-wrap ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-panel mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks</p>

            <Select value={filter} onValueChange={(v) => setFilter("filter", v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={(v) => setFilter("assignee", v)}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={(v) => setFilter("project", v)}>
              <SelectTrigger className="w-[170px] h-8 text-xs">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {PROJECTS.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setSearchParams({}, { replace: true })}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-card px-2.5 py-1">View: {filterLabel}</span>
          {projectFilter !== "all" && (
            <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-primary">
              Project: {getProjectById(projectFilter)?.name ?? "Unknown"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="dashboard-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">All Matching Tasks</h3>
                <p className="text-xs text-muted-foreground">Sorted so overdue and active work appears first.</p>
              </div>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} teamMembers={teamMembers} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </AnimatePresence>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No tasks match the current filters.</p>
                </div>
              )}
            </div>
          </section>

          <div className="space-y-4">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Focus Now</h3>
                  <p className="text-xs text-muted-foreground">The first tasks to review across the workspace.</p>
                </div>
              </div>
              <div className="space-y-2">
                {focusTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEdit(task)}
                    className="dashboard-task-row text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{getProjectById(task.projectId)?.name ?? "Unassigned"}</span>
                        <span>{task.status === "inprogress" ? "In progress" : task.status === "completed" ? "Completed" : "Todo"}</span>
                      </div>
                    </div>
                    <div className={`dashboard-task-eye ${task.dueDate < today && task.status !== "completed" ? "border-rose-500/30 text-rose-400" : ""}`}>
                      <Clock3 className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
                {focusTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tasks to highlight.</p>
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Workload by Member</h3>
                  <p className="text-xs text-muted-foreground">Use this to spot who owns the current work.</p>
                </div>
              </div>
              <div className="space-y-2">
                {memberWorkload.map(({ member, total, overdue, inProgress, nextTask }) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setFilter("assignee", member.id)}
                    className="dashboard-project-card w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{member.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {total} tasks, {inProgress} in progress{overdue > 0 ? `, ${overdue} overdue` : ""}
                        </p>
                        {nextTask && (
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            Next: {nextTask.title}
                          </p>
                        )}
                      </div>
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </span>
                    </div>
                  </button>
                ))}
                {memberWorkload.length === 0 && (
                  <p className="text-sm text-muted-foreground">No assigned tasks in this view.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
