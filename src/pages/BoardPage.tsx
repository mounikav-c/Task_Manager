import { CalendarDays, MoreHorizontal, Plus } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Assignee, Task, Status } from "@/lib/store";
import { getAssignee } from "@/lib/store";
import { PROJECTS } from "@/lib/projects";
import { useNavigate } from "react-router-dom";

interface Props {
  tasks: Task[];
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

export function BoardPage({ tasks, teamMembers, onNew }: Props) {
  const navigate = useNavigate();

  const projectCards = PROJECTS.map((project, index) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const team = project.team
      .map((member) => getAssignee(member.memberId, teamMembers))
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
        <div className="rounded-[1.7rem] border border-border/80 bg-secondary p-4 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.25)] md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projects overview</p>
              <h2 className="text-xl font-semibold tracking-tight">Active delivery board</h2>
            </div>
            <Button onClick={onNew} className="rounded-xl bg-primary hover:bg-primary/90 shadow-[0_14px_30px_-22px_rgba(139,92,246,0.55)]">
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`project-card-badge ${project.accent}`} />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{project.name}</h3>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-secondary p-2 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-border/80" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {project.team.slice(0, 3).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-card shadow-sm">
                        <AvatarFallback className="text-[10px] font-semibold text-white" style={{ backgroundColor: member.color }}>
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {project.openTasks === 0 ? "No task pending" : `${project.openTasks} task due soon`}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">Project Progress</span>
                    <span className="text-xs font-semibold text-muted-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e2e2e5]">
                    <div className="h-full rounded-full bg-[#b58cf4] transition-all duration-300" style={{ width: `${project.progress}%` }} />
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
