import { CheckCheck, FolderPlus, Plus, Users, Video, Clock, AlertTriangle, ListChecks } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
  status: "todo" | "inprogress" | "completed";
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
  onDelete: (id: string) => void;
  onAddProject: () => void;
  onNew: () => void;
  onAddMember: () => void;
  onScheduleMeeting: () => void;
}

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

function getProjectName(projectId: string | undefined, projects: Project[]) {
  return projects.find((project) => project.id === projectId)?.name ?? "Project task";
}

function getProgressRing(progress: number) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return { radius, circumference, dashOffset };
}

export function DashboardPage({ tasks, projects, teamMembers, onEdit, onAddProject, onNew, onAddMember, onScheduleMeeting }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const openTasksView = (filterValue?: string) => {
    navigate(`/tasks${filterValue && filterValue !== "all" ? `?filter=${filterValue}` : ""}`, {
      state: { fromPath: "/", fromLabel: "Dashboard" },
    });
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "todo" || task.status === "inprogress").length;
  const overdueTasks = tasks.filter((task) => task.dueDate < today && task.status !== "completed").length;

  const statCards = [
    { label: "Total Tasks", value: totalTasks, icon: ListChecks, filter: "all", gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Completed", value: completedTasks, icon: CheckCheck, filter: "completed", gradient: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
    { label: "Pending", value: pendingTasks, icon: Clock, filter: "pending", gradient: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
    { label: "Overdue", value: overdueTasks, icon: AlertTriangle, filter: "overdue", gradient: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-400" },
  ];

  const assignedTasks = [...tasks]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const projectCards = projects.slice(0, 4).map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const pendingCount = projectTasks.filter((task) => task.status !== "completed").length;
    const inProgressCount = projectTasks.filter((task) => task.status === "inprogress").length;
    const completedCount = projectTasks.filter((task) => task.status === "completed").length;
    const progress = projectTasks.length === 0 ? 0 : Math.round((completedCount / projectTasks.length) * 100);
    const statusTag = pendingCount === 0
      ? { label: "On Track", tone: "bg-emerald-500/12 text-emerald-500 border-emerald-500/20" }
      : inProgressCount > 0
        ? { label: "In Progress", tone: "bg-amber-500/12 text-amber-500 border-amber-500/20" }
        : { label: "Starting", tone: "bg-sky-500/12 text-sky-500 border-sky-500/20" };

    let note = "No tasks yet";
    if (pendingCount === 1) {
      note = "1 task to start";
    } else if (pendingCount > 1) {
      note = `${pendingCount} tasks open`;
    }

    if (inProgressCount > 0) {
      note = inProgressCount === 1 ? "1 task in progress" : `${inProgressCount} tasks in progress`;
    }

    return {
      id: project.id,
      projectName: project.name,
      note,
      progress,
      statusTag,
    };
  });

  const upcomingDeadlines = [...tasks]
    .filter((task) => task.status !== "completed")
    .sort((a, b) => {
      const left = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    })
    .slice(0, 4)
    .map((task) => ({
      ...task,
      statusTag: task.dueDate && task.dueDate < today
        ? { label: "Overdue", tone: "bg-rose-500/12 text-rose-500 border-rose-500/20" }
        : { label: "On Track", tone: "bg-emerald-500/12 text-emerald-500 border-emerald-500/20" },
    }));

  const actionHandlers = [
    () => onAddProject(),
    () => onNew(),
    () => onAddMember(),
    () => onScheduleMeeting(),
  ];

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <TopNav title="Dashboard" />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 md:p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((stat, index) => (
              <motion.button
                key={stat.label}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openTasksView(stat.filter)}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
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

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Assigned Tasks</h2>
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
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{getProjectName(task.projectId, projects)}</span>
                        <span className="text-border">&bull;</span>
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
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {projectCards.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() =>
                      navigate(`/projects/${project.id}`, {
                        state: { fromPath: "/", fromLabel: "Dashboard" },
                      })
                    }
                    className="dashboard-project-card text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/65 text-sm font-semibold text-foreground">
                        {project.projectName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{project.projectName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${project.statusTag.tone}`}>
                            {project.statusTag.label}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{project.note}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {(() => {
                          const ring = getProgressRing(project.progress);
                          const gradientId = `project-ring-${project.id}`;

                          return (
                            <div className="relative flex h-10 w-10 items-center justify-center">
                              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r={ring.radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="4" />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r={ring.radius}
                                  fill="none"
                                  stroke={`url(#${gradientId})`}
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={ring.circumference}
                                  strokeDashoffset={ring.dashOffset}
                                />
                                <defs>
                                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <span className="absolute text-[10px] font-semibold text-foreground">{project.progress}%</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.95fr)]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Upcoming Deadlines</h2>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg border-border/50 bg-card/80 text-xs h-8" onClick={() => openTasksView("pending")}>
                  Open Tasks
                </Button>
              </div>

              <div className="space-y-2">
                {upcomingDeadlines.map((task) => (
                  <button key={task.id} type="button" onClick={() => onEdit(task)} className="dashboard-activity-row w-full text-left transition-all duration-200 hover:border-primary/25 hover:bg-card">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      task.dueDate && task.dueDate < today ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"
                    }`}>
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {getProjectName(task.projectId, projects)} &bull; {task.dueDate
                          ? `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : "No due date"}
                      </p>
                    </div>
                    <span className={`ml-auto shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${task.statusTag.tone}`}>
                      {task.statusTag.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">People ({teamMembers.length})</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() =>
                      navigate(`/members/${member.id}`, {
                        state: { fromPath: "/", fromLabel: "Dashboard" },
                      })
                    }
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
