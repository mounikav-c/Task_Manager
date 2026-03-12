import { CalendarDays, CheckCheck, FolderPlus, Plus, Users, Video, TrendingUp, Clock, AlertTriangle, ListChecks } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Assignee, Task } from "@/lib/store";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Props {
  tasks: Task[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddProject: () => void;
  onNew: () => void;
  onAddMember: () => void;
}

const projectNames = [
  "72ipo",
  "Monashee Insights",
  "Real Estate",
  "CRM Website Design",
  "Delivery Website",
  "Mobile App",
];

const quickActions = [
  {
    title: "Create Project",
    description: "Start a new project",
    icon: FolderPlus,
    tone: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "Create Task",
    description: "Add a task to project",
    icon: Plus,
    tone: "bg-sky-500/15 text-sky-400",
  },
  {
    title: "Invite to Team",
    description: "Invite team members",
    icon: Users,
    tone: "bg-fuchsia-500/15 text-fuchsia-400",
  },
  {
    title: "Schedule Meeting",
    description: "Plan a meeting",
    icon: Video,
    tone: "bg-amber-500/15 text-amber-400",
  },
];

export function DashboardPage({ tasks, teamMembers, onEdit, onAddProject, onNew, onAddMember }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "inprogress").length;
  const overdueTasks = tasks.filter((t) => t.dueDate < today && t.status !== "completed").length;

  const statCards = [
    { label: "Total Tasks", value: totalTasks, icon: ListChecks, filter: "all", gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Completed", value: completedTasks, icon: CheckCheck, filter: "completed", gradient: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
    { label: "Pending", value: pendingTasks, icon: Clock, filter: "pending", gradient: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
    { label: "Overdue", value: overdueTasks, icon: AlertTriangle, filter: "overdue", gradient: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-400" },
  ];

  const assignedTasks = [...tasks]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const projectCards = tasks.slice(0, 4).map((task, index) => ({
    ...task,
    projectName: projectNames[index] ?? task.title,
    note:
      task.status === "completed"
        ? "No task pending"
        : task.status === "inprogress"
          ? `${Math.max(1, Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000))} task due soon`
          : "1 task to start",
  }));

  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const actionHandlers = [
    () => onAddProject(),
    () => onNew(),
    () => onAddMember(),
    () => navigate("/members"),
  ];

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Dashboard" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {statCards.map((stat, index) => (
              <motion.button
                key={stat.label}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/tasks${stat.filter !== "all" ? `?filter=${stat.filter}` : ""}`)}
                className="stat-card text-left group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="stat-card-label text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="stat-card-value mt-1 text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`stat-card-icon-wrap ${stat.iconColor}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.04 }}
                onClick={actionHandlers[index]}
                className="dashboard-action-card text-left"
              >
                <div className={`dashboard-action-icon ${action.tone}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{action.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Assigned Tasks</h2>
                  <p className="text-xs text-muted-foreground">What needs attention first.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg border-border/50 bg-card/80 text-xs h-8">
                  Nearest Due
                </Button>
              </div>

              <div className="space-y-1.5">
                {assignedTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEdit(task)}
                    className="dashboard-task-row"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{projectNames[tasks.findIndex((item) => item.id === task.id)] ?? "Project task"}</span>
                        <span className="text-border">•</span>
                        <span className={task.dueDate < today && task.status !== "completed" ? "text-rose-400 font-medium" : ""}>
                          {task.dueDate < today && task.status !== "completed"
                            ? "Overdue"
                            : `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-task-eye">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Projects</h2>
                  <p className="text-xs text-muted-foreground">Active workstreams.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {projectCards.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate("/board")}
                    className="dashboard-project-card text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-accent text-sm font-semibold text-foreground">
                        {project.projectName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{project.projectName}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{project.note}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Open</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Recent Activity</h2>
                  <p className="text-xs text-muted-foreground">Latest workspace updates.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg border-border/50 bg-card/80 text-xs h-8" onClick={() => navigate("/tasks")}>
                  View All
                </Button>
              </div>

              <div className="space-y-2">
                {recentActivity.map((task) => (
                  <div key={task.id} className="dashboard-activity-row">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.status === "completed" ? "Task completed" : task.status === "inprogress" ? "Work in progress" : "Task created"} •{" "}
                        {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">People ({teamMembers.length})</h2>
                  <p className="text-xs text-muted-foreground">Working across projects.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => navigate("/members")}
                    className="dashboard-person-card text-center"
                  >
                    <Avatar className="mx-auto h-12 w-12 ring-1 ring-border/30">
                      <AvatarFallback className="text-xs font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-2 text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Workspace member</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
