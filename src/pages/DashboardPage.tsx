import { CalendarDays, CheckCheck, FolderPlus, Plus, Users, Video } from "lucide-react";
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
    description: "Create a project for your tasks",
    icon: FolderPlus,
    tone: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "Create Task",
    description: "Create task for your project",
    icon: Plus,
    tone: "bg-sky-100 text-sky-600",
  },
  {
    title: "Invite to Team",
    description: "Invite people to your team",
    icon: Users,
    tone: "bg-fuchsia-100 text-fuchsia-600",
  },
  {
    title: "Schedule Meeting",
    description: "Schedule a meeting for project",
    icon: Video,
    tone: "bg-amber-100 text-amber-600",
  },
];

export function DashboardPage({ tasks, teamMembers, onEdit, onAddProject, onNew, onAddMember }: Props) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={actionHandlers[index]}
                className="dashboard-action-card text-left"
              >
                <div className={`dashboard-action-icon ${action.tone}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{action.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Assigned Tasks</h2>
                  <p className="text-sm text-muted-foreground">What needs attention first.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-border/70 bg-card">
                  Nearest Due Date
                </Button>
              </div>

              <div className="space-y-2">
                {assignedTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onEdit(task)}
                    className="dashboard-task-row"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-foreground">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{projectNames[tasks.findIndex((item) => item.id === task.id)] ?? "Project task"}</span>
                        <span>&bull;</span>
                        <span className={task.dueDate < today && task.status !== "completed" ? "text-destructive font-medium" : ""}>
                          {task.dueDate < today && task.status !== "completed"
                            ? "Overdue"
                            : `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-task-eye">
                      <CheckCheck className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Projects</h2>
                  <p className="text-sm text-muted-foreground">Current active workstreams.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {projectCards.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigate("/board")}
                    className="dashboard-project-card text-left"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-secondary text-base font-semibold text-foreground">
                      {project.projectName[0]}
                    </div>
                    <p className="text-base font-medium text-foreground">{project.projectName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{project.note}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <section className="dashboard-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <p className="text-sm text-muted-foreground">Latest work updates in the workspace.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-border/70 bg-card" onClick={() => navigate("/tasks")}>
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {recentActivity.map((task) => (
                  <div key={task.id} className="dashboard-activity-row">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <CheckCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.status === "completed" ? "Task completed" : task.status === "inprogress" ? "Work in progress" : "Task created"} &bull;{" "}
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
                  <h2 className="text-lg font-semibold">People ({teamMembers.length})</h2>
                  <p className="text-sm text-muted-foreground">Who is working across projects.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => navigate("/members")}
                    className="dashboard-person-card text-center"
                  >
                    <Avatar className="mx-auto h-14 w-14 border border-border shadow-sm">
                      <AvatarFallback className="text-sm font-semibold text-white" style={{ backgroundColor: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="mt-3 text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Workspace member</p>
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
