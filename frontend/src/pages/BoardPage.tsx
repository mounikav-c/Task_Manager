import { CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  status: "Planning" | "Active" | "At Risk" | "Completed";
  progress: number;
}

interface Props {
  tasks: Task[];
  projects: Project[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onUpdateStatus: (id: string, status: Status) => void;
}

const progressMap: Record<Status, number> = {
  todo: 24,
  inprogress: 62,
  completed: 100,
};

const projectIcons = [
  "bg-violet-500",
  "bg-violet-400",
  "bg-indigo-500",
  "bg-rose-400",
  "bg-purple-500",
  "bg-emerald-500",
];

function getAssignee(id: string | undefined, teamMembers: Assignee[]) {
  return teamMembers.find((member) => member.id === id);
}

export function BoardPage({ tasks, projects, teamMembers, onNew }: Props) {
  const navigate = useNavigate();

  const projectCards = projects.map((project, index) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const team = Array.from(new Set(projectTasks.map((task) => task.assigneeId).filter(Boolean)))
      .map((assigneeId) => getAssignee(assigneeId, teamMembers))
      .filter(Boolean) as Assignee[];

    const progress = projectTasks.length === 0
      ? project.progress
      : Math.round(projectTasks.reduce((sum, task) => sum + progressMap[task.status], 0) / projectTasks.length);

    const openTasks = projectTasks.filter((task) => task.status !== "completed").length;

    return {
      ...project,
      team,
      progress,
      openTasks,
      accent: projectIcons[index % projectIcons.length],
    };
  });

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Projects" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="dashboard-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Projects overview</p>
              <h2 className="text-lg font-semibold tracking-tight">Active delivery board</h2>
            </div>
            <Button onClick={onNew} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 text-sm h-9">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(`/projects/${project.id}`)}
                className="project-card group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`project-card-badge ${project.accent}`} />
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold tracking-tight text-foreground">{project.name}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-border/50" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-7 w-7 border-2 border-card ring-0">
                        <AvatarFallback className="text-[10px] font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {project.openTasks === 0 ? "No task pending" : `${project.openTasks} due soon`}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
