import { ArrowLeft, CalendarDays, LayoutGrid, List, Plus, Users, X } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthUser } from "@/contexts/AuthUserContext";

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
}

interface Props {
  tasks: Task[];
  availableTasks: Task[];
  projects: Project[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClaimTask: (id: string) => void;
  isClaimingTask: boolean;
}

function getAssignee(id: string | undefined, teamMembers: Assignee[]) {
  return teamMembers.find((member) => member.id === id);
}

function getProjectById(projects: Project[], projectId?: string) {
  return projects.find((project) => project.id === projectId);
}

const boardColumns: Array<{
  key: Status;
  title: string;
  accent: string;
  hint: string;
  columnClass: string;
  addClass: string;
}> = [
  {
    key: "todo",
    title: "TO DO",
    accent: "border-slate-300/50 bg-white/80 text-slate-700",
    hint: "Ready to start",
    columnClass: "border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(243,244,255,0.52))] shadow-[0_24px_60px_-48px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl",
    addClass: "text-slate-500 hover:text-slate-700",
  },
  {
    key: "inprogress",
    title: "IN PROGRESS",
    accent: "border-indigo-300/40 bg-[linear-gradient(135deg,#4f46e5_0%,#5b21b6_100%)] text-white",
    hint: "Work happening now",
    columnClass: "border border-white/55 bg-[linear-gradient(135deg,rgba(238,242,255,0.88),rgba(243,244,255,0.72))] shadow-[0_24px_60px_-48px_rgba(15,23,42,0.18),0_16px_34px_-28px_rgba(79,70,229,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl",
    addClass: "text-indigo-600 hover:text-indigo-700",
  },
  {
    key: "completed",
    title: "COMPLETE",
    accent: "border-emerald-500/30 bg-emerald-600 text-white",
    hint: "Recently finished",
    columnClass: "border border-white/55 bg-[linear-gradient(135deg,rgba(240,253,244,0.9),rgba(236,253,245,0.72))] shadow-[0_24px_60px_-48px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl",
    addClass: "text-emerald-600 hover:text-emerald-700",
  },
];

const boardCardAccent: Record<Task["priority"], string> = {
  high: "border-l-rose-400",
  medium: "border-l-amber-400",
  low: "border-l-emerald-400",
};

export function TasksPage({ tasks, availableTasks, projects, teamMembers, onEdit, onDelete, onNew, onClaimTask, isClaimingTask }: Props) {
  const { canEditSelectedDepartment } = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const assigneeFilter = searchParams.get("assignee") || "all";
  const projectFilter = searchParams.get("project") || "all";
  const today = new Date().toISOString().split("T")[0];
  const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
  const statusWeight: Record<Status, number> = { inprogress: 0, todo: 1, completed: 2 };
  const assignedTasks = useMemo(() => tasks.filter((task) => Boolean(task.assigneeId)), [tasks]);

  const filteredTasks = useMemo(() => {
    let result = assignedTasks;

    if (filter === "completed") result = result.filter((task) => task.status === "completed");
    else if (filter === "pending") result = result.filter((task) => task.status !== "completed");
    else if (filter === "overdue") result = result.filter((task) => task.dueDate < today && task.status !== "completed");

    if (assigneeFilter !== "all") result = result.filter((task) => task.assigneeId === assigneeFilter);
    if (projectFilter !== "all") result = result.filter((task) => task.projectId === projectFilter);

    return [...result].sort((a, b) => {
      const overdueDelta = Number(a.dueDate < today && a.status !== "completed") - Number(b.dueDate < today && b.status !== "completed");
      if (overdueDelta !== 0) return overdueDelta * -1;

      const statusDelta = statusWeight[a.status] - statusWeight[b.status];
      if (statusDelta !== 0) return statusDelta;

      const priorityDelta = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDelta !== 0) return priorityDelta;

      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [assignedTasks, filter, assigneeFilter, projectFilter, today]);

  const groupedBoardTasks = useMemo(
    () =>
      boardColumns.map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.key),
      })),
    [filteredTasks],
  );

  const workload = useMemo(() => {
    const maxOpen = Math.max(
      1,
      ...teamMembers.map((member) => filteredTasks.filter((task) => task.assigneeId === member.id && task.status !== "completed").length),
    );

    return teamMembers
      .map((member) => {
        const assigned = filteredTasks.filter((task) => task.assigneeId === member.id);
        const open = assigned.filter((task) => task.status !== "completed");
        const completed = assigned.filter((task) => task.status === "completed");
        const overdue = open.filter((task) => task.dueDate < today).length;

        return {
          member,
          total: assigned.length,
          openCount: open.length,
          completedCount: completed.length,
          overdueCount: overdue,
          nextTask: open[0],
          loadWidth: `${Math.max(10, Math.round((open.length / maxOpen) * 100))}%`,
        };
      })
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount || b.total - a.total);
  }, [filteredTasks, teamMembers, today]);

  const summary = {
    total: filteredTasks.length,
    open: filteredTasks.filter((task) => task.status !== "completed").length,
    overdue: filteredTasks.filter((task) => task.dueDate < today && task.status !== "completed").length,
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const hasFilters = filter !== "all" || assigneeFilter !== "all" || projectFilter !== "all";
  const fromPath = location.state?.fromPath as string | undefined;
  const fromLabel = location.state?.fromLabel as string | undefined;

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Tasks" />
      <div className="flex-1 overflow-auto p-3 md:p-4">
        <section className="mb-3 rounded-[1.15rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.54))] px-4 py-3 md:px-5 md:py-4 backdrop-blur-xl" style={{ boxShadow: "0 24px 56px -46px rgba(15,23,42,0.18), 0 14px 32px -28px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.72)" }}>
          {fromPath && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(fromPath)}
              className="mb-2 h-7 rounded-lg px-2 text-xs text-muted-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {fromLabel ?? "previous page"}
            </Button>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-[1.9rem] font-extrabold tracking-tight text-foreground leading-none">Tasks</h2>
            <Button onClick={onNew} disabled={!canEditSelectedDepartment} size="sm" className="h-10 gap-1.5 rounded-xl bg-[linear-gradient(135deg,#4338ca_0%,#5b21b6_100%)] px-4 text-white shadow-[0_18px_35px_-20px_rgba(79,70,229,0.38)] hover:brightness-105">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </div>

          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <div className="rounded-lg border border-border/60 bg-secondary px-3 py-2 text-xs text-muted-foreground">
              {summary.total} total
            </div>

            <button
              type="button"
              onClick={() => setFilter("filter", filter === "pending" ? "all" : "pending")}
              className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                filter === "pending"
                  ? "border-indigo-300/35 bg-indigo-500/10 text-indigo-700"
                  : "border-indigo-300/20 bg-indigo-500/5 text-indigo-700 hover:bg-indigo-500/10"
              }`}
            >
              {summary.open} open
            </button>

            <button
              type="button"
              onClick={() => setFilter("filter", filter === "overdue" ? "all" : "overdue")}
              className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                filter === "overdue"
                  ? "border-rose-500/30 bg-rose-500/12 text-rose-600"
                  : "border-rose-500/20 bg-rose-500/8 text-rose-500 hover:bg-rose-500/12"
              }`}
            >
              {summary.overdue} overdue
            </button>

            <Select value={filter} onValueChange={(v) => setFilter("filter", v)}>
              <SelectTrigger className="h-9 w-[135px] rounded-lg border-white/60 bg-white/70 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Open Work</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={(v) => setFilter("assignee", v)}>
              <SelectTrigger className="h-9 w-[150px] rounded-lg border-white/60 bg-white/70 text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={(v) => setFilter("project", v)}>
              <SelectTrigger className="h-9 w-[170px] rounded-lg border-white/60 bg-white/70 text-xs">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-9 rounded-lg text-xs gap-1" onClick={() => setSearchParams({}, { replace: true })}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </section>

        <section
          className="mb-3 rounded-[1.15rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.54))] p-4 backdrop-blur-xl"
          style={{ boxShadow: "0 24px 56px -46px rgba(15,23,42,0.18), 0 14px 32px -28px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.72)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Available Tasks</h3>
              <p className="mt-1 text-xs text-muted-foreground">Unassigned work that any signed-in teammate can claim and move into progress.</p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {availableTasks.length} available
            </span>
          </div>

          {availableTasks.length === 0 ? (
            <div className="mt-4 rounded-[0.95rem] border border-dashed border-border/50 bg-white/55 px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No available tasks right now.</p>
              <p className="mt-1 text-xs text-muted-foreground">Any new unassigned task will show up here.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableTasks.map((task) => (
                <article
                  key={task.id}
                  className={`rounded-[1rem] border border-white/60 border-l-[3px] ${boardCardAccent[task.priority]} bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(248,250,252,0.76))] p-4 shadow-[0_18px_30px_-24px_rgba(15,23,42,0.14)]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">{task.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {getProjectById(projects, task.projectId)?.name ?? "Unassigned project"}
                      </p>
                    </div>
                    <span className={`priority-pill priority-${task.priority} whitespace-nowrap`}>
                      {task.priority}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {task.description || "No description added yet."}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border/60 bg-white/70 px-2.5 py-1">
                      Unassigned
                    </span>
                    <span className={`inline-flex items-center gap-1.5 ${task.dueDate && task.dueDate < today ? "font-medium text-rose-500" : ""}`}>
                      <CalendarDays className="h-3.5 w-3.5" />
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "No due date"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    onClick={() => onClaimTask(task.id)}
                    disabled={isClaimingTask || !canEditSelectedDepartment}
                    className="mt-4 h-9 w-full rounded-xl bg-[linear-gradient(135deg,#059669_0%,#0f766e_100%)] text-white hover:brightness-105"
                  >
                    {!canEditSelectedDepartment ? "View Only" : isClaimingTask ? "Claiming..." : "Claim Task"}
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>

        <Tabs defaultValue="board" className="space-y-3">
          <TabsList className="h-10 rounded-[0.9rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(243,244,255,0.5))] p-1 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.16)]">
            <TabsTrigger value="board" className="rounded-[0.8rem] px-4 gap-2">
              <LayoutGrid className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-[0.8rem] px-4 gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="workload" className="rounded-[0.8rem] px-4 gap-2">
              <Users className="h-4 w-4" />
              Workload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-0">
            <div className="grid items-start gap-4 xl:grid-cols-3">
              {groupedBoardTasks.map((column) => (
                <section
                  key={column.key}
                  className={`self-start rounded-[1rem] p-3 ${column.columnClass}`}
                >
                  <div className="mb-3 px-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold leading-none ${column.accent}`}>
                          {column.title}
                        </span>
                        <span className="text-sm font-semibold text-foreground/80">{column.tasks.length}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{column.hint}</p>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {column.tasks.map((task) => {
                        const assignee = getAssignee(task.assigneeId, teamMembers);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onEdit(task)}
                            className={`group w-full rounded-[0.85rem] border border-white/60 border-l-[3px] ${boardCardAccent[task.priority]} bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(248,250,252,0.76))] px-3 py-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-indigo-200/40 hover:shadow-[0_18px_30px_-22px_rgba(15,23,42,0.2),0_10px_24px_-22px_rgba(79,70,229,0.08)]`}
                          >
                            <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800 transition-colors duration-200 group-hover:text-primary">{task.title}</h4>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5">
                              <div className="flex min-w-0 items-center gap-2">
                                {assignee ? (
                                  <>
                                    <span
                                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                                      style={{ backgroundColor: assignee.color }}
                                    >
                                      {assignee.initials}
                                    </span>
                                    <span className="truncate">{assignee.name}</span>
                                  </>
                                ) : (
                                  <span>Unassigned</span>
                                )}
                              </div>
                              <span className={`ml-auto shrink-0 ${task.dueDate < today && task.status !== "completed" ? "text-rose-500 font-medium" : "text-slate-500"}`}>
                                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </AnimatePresence>
                    {column.tasks.length === 0 && (
                      <div className="rounded-[0.85rem] border border-dashed border-[#d8d2d2] bg-white/70 px-4 py-8 text-center">
                        <p className="text-sm font-medium text-slate-700">No tasks</p>
                        <p className="mt-1 text-xs text-slate-500">Nothing in this stage right now.</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onNew}
                    disabled={!canEditSelectedDepartment}
                    className={`mt-3 w-full rounded-[0.8rem] px-3 py-2 text-left text-sm font-medium transition-colors ${column.addClass}`}
                  >
                    + Add Task
                  </button>
                </section>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <section className="rounded-[1.2rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.52))] p-3 backdrop-blur-xl" style={{ boxShadow: "0 24px 56px -46px rgba(15,23,42,0.18), 0 14px 32px -28px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.72)" }}>
              <div className="mb-2">
                <h3 className="text-base font-semibold text-foreground">List View</h3>
              </div>

              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[38%]">Task</TableHead>
                    <TableHead className="w-[16%]">Project</TableHead>
                    <TableHead className="w-[18%]">Assignee</TableHead>
                    <TableHead className="w-[12%] whitespace-nowrap">Due Date</TableHead>
                    <TableHead className="w-[8%] whitespace-nowrap">Priority</TableHead>
                    <TableHead className="w-[8%] whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const assignee = getAssignee(task.assigneeId, teamMembers);
                    return (
                      <TableRow
                        key={task.id}
                        className="group cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-20px_rgba(15,23,42,0.28)]"
                        onClick={() => onEdit(task)}
                      >
                        <TableCell className="pr-3">
                          <div className="max-w-[360px]">
                            <p className="font-medium text-foreground transition-colors duration-200 group-hover:text-primary">{task.title}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="pr-3 text-sm text-muted-foreground">
                          {getProjectById(projects, task.projectId)?.name ?? "Unassigned"}
                        </TableCell>
                        <TableCell className="pr-3">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                                style={{ backgroundColor: assignee.color }}
                              >
                                {assignee.initials}
                              </span>
                              <span className="text-sm text-foreground">{assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="pr-3">
                          <div className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${task.dueDate < today && task.status !== "completed" ? "text-rose-400" : "text-muted-foreground"}`}>
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </TableCell>
                        <TableCell className="pr-3">
                          <span className={`priority-pill priority-${task.priority} whitespace-nowrap`}>
                            {task.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`status-pill status-${task.status} whitespace-nowrap`}>
                            {task.status === "inprogress" ? "In Progress" : task.status === "completed" ? "Completed" : "Todo"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredTasks.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No tasks match the current filters.</p>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="workload" className="mt-0">
            <section className="rounded-[1.2rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.52))] p-4 backdrop-blur-xl" style={{ boxShadow: "0 24px 56px -46px rgba(15,23,42,0.18), 0 14px 32px -28px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.72)" }}>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Workload View</h3>
                <p className="text-xs text-muted-foreground">See who has the most open work and where managers may need to rebalance tasks.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {workload.map((entry) => (
                  <button
                    key={entry.member.id}
                    type="button"
                    onClick={() => setFilter("assignee", entry.member.id)}
                    className="rounded-[1rem] border border-border/70 bg-secondary/45 p-4 text-left transition-colors hover:border-primary/20 hover:bg-secondary/65"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-primary-foreground"
                          style={{ backgroundColor: entry.member.color }}
                        >
                          {entry.member.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{entry.member.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.total} total tasks</p>
                        </div>
                      </div>
                      {entry.overdueCount > 0 && (
                        <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300">
                          {entry.overdueCount} overdue
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Open load</span>
                        <span>{entry.openCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                          style={{ width: entry.loadWidth }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="rounded-full border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
                        {entry.completedCount} completed
                      </span>
                      <span className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-primary">
                        {entry.openCount} active
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl border border-border/60 bg-card/70 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next Task</p>
                      <p className="mt-2 truncate text-sm font-medium text-foreground">
                        {entry.nextTask?.title ?? "No open tasks"}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {entry.nextTask ? getProjectById(projects, entry.nextTask.projectId)?.name ?? "Unassigned" : "Nothing pending"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {workload.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No workload data in this filtered view.</p>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
