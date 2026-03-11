import { useMemo } from "react";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Assignee, Status, Task } from "@/lib/store";
import { getAssignee } from "@/lib/store";
import { getProjectById } from "@/lib/projects";

interface Props {
  tasks: Task[];
  teamMembers: Assignee[];
  onEdit: (task: Task) => void;
  onNew: (projectId?: string) => void;
}

const statusLabels: Record<Status, string> = {
  todo: "Todo",
  inprogress: "In Progress",
  completed: "Completed",
};

export function ProjectDetailsPage({ tasks, teamMembers, onEdit, onNew }: Props) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const project = getProjectById(projectId);

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
  const team = project.team
    .map((member) => ({
      member: getAssignee(member.memberId, teamMembers),
      role: member.role,
    }))
    .filter((entry) => entry.member);

  return (
    <div className="flex h-full flex-col">
      <TopNav title={project.name} />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="px-2 pt-2">
            <Button variant="ghost" className="mb-5 h-9 rounded-xl px-3 text-muted-foreground" onClick={() => navigate("/board")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>

            <div className="flex flex-col gap-5 rounded-[1.4rem] border border-border/70 bg-white px-6 py-6 shadow-[0_18px_40px_-38px_rgba(15,23,42,0.35)] lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="project-details-kicker">Project Details</p>
                <h1 className="mt-2 text-[2.1rem] font-semibold tracking-tight text-foreground sm:text-[2.25rem]">{project.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{project.description}</p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[520px]">
                <div className="rounded-2xl bg-[#f7f7f9] px-4 py-4">
                  <span className="project-details-label">Start Date</span>
                  <p className="project-details-value">{new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f7f9] px-4 py-4">
                  <span className="project-details-label">Deadline</span>
                  <p className="project-details-value">{new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f7f9] px-4 py-4">
                  <span className="project-details-label">Owner</span>
                  <p className="project-details-value">{owner?.name ?? "Unassigned"}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div className="rounded-[1.1rem] border border-border/70 bg-white px-5 py-5">
                <h2 className="text-lg font-semibold text-foreground">About This Project</h2>
                <div className="mt-4 rounded-2xl bg-[#f7f7f9] px-4 py-4">
                  <span className="project-details-label">Project Explanation</span>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
                </div>
              </div>

              <div className="rounded-[1.1rem] border border-border/70 bg-white px-5 py-5">
                <div className="flex flex-col gap-4 border-b border-border/60 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Project Overview</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Important project details in one place.</p>
                  </div>
                  <div className="w-full max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {project.status}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#ececf1]">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border/60 bg-[#fbfbfc] px-4 py-4">
                    <span className="project-details-label">Start Date</span>
                    <p className="project-details-value">{new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-[#fbfbfc] px-4 py-4">
                    <span className="project-details-label">Deadline</span>
                    <p className="project-details-value">{new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-[#fbfbfc] px-4 py-4">
                    <span className="project-details-label">Owner</span>
                    <p className="project-details-value">{owner?.name ?? "Unassigned"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-[#fbfbfc] px-4 py-4">
                    <span className="project-details-label">Open Tasks</span>
                    <p className="project-details-value">{projectTasks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-[1rem] border border-border/70 bg-white p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-border/60 pb-4">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Team Members</h2>
                <p className="text-sm text-muted-foreground">People working on this project.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {team.map((entry) => (
                <div key={`${entry.member?.id}-${entry.role}`} className="flex items-center gap-3 rounded-[1rem] bg-[#f7f7f9] px-4 py-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: entry.member?.color }}>
                      {entry.member?.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{entry.member?.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1rem] border border-border/70 bg-white p-6">
            <div className="mb-5 flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Project Tasks</h2>
                <p className="text-sm text-muted-foreground">All tasks related to this project.</p>
              </div>
              <Button className="h-11 rounded-xl px-4" onClick={() => onNew(project.id)}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>

            {projectTasks.length === 0 ? (
              <div className="rounded-[1.15rem] border border-dashed border-border/80 bg-white px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No tasks added for this project yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Use Add Task to create the first task.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[1.1rem] border border-border/70 bg-white">
                <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] gap-4 border-b border-border/60 bg-[#f7f7f9] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:grid">
                  <span>Task</span>
                  <span>Assigned Member</span>
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
                      className="grid w-full gap-3 border-b border-border/60 px-5 py-4 text-left transition-colors hover:bg-[#fcfcfe] last:border-b-0 md:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground">{task.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground md:hidden">{assignee?.name ?? "Unassigned"}</p>
                      </div>
                      <div className="hidden text-sm text-foreground md:block">{assignee?.name ?? "Unassigned"}</div>
                      <div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium priority-${task.priority}`}>{task.priority}</span>
                      </div>
                      <div className="text-sm text-foreground">{statusLabels[task.status]}</div>
                      <div className="text-sm text-foreground">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
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
