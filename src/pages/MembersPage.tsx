import { BriefcaseBusiness, CircleDot, Plus, UserRound } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Assignee, Task } from "@/lib/store";

interface Props {
  tasks: Task[];
  teamMembers: Assignee[];
  onAddMember: () => void;
}

export function MembersPage({ tasks, teamMembers, onAddMember }: Props) {
  const members = teamMembers.map((member) => {
    const assignedTasks = tasks.filter((task) => task.assigneeId === member.id);
    const activeCount = assignedTasks.filter((task) => task.status !== "completed").length;
    const completedCount = assignedTasks.filter((task) => task.status === "completed").length;

    return {
      ...member,
      assignedTasks,
      activeCount,
      completedCount,
    };
  });

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Members" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="rounded-[1.7rem] border border-border/80 bg-secondary p-4 shadow-[0_18px_40px_-34px_rgba(0,0,0,0.25)] md:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Team directory</p>
              <h2 className="text-xl font-semibold tracking-tight">People and current workload</h2>
            </div>
            <Button onClick={onAddMember} className="rounded-xl bg-primary hover:bg-primary/90 shadow-[0_14px_30px_-22px_rgba(139,92,246,0.55)]">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[1.35rem] border border-border/75 bg-card p-4 shadow-[0_16px_34px_-30px_rgba(0,0,0,0.3)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-12 w-12 border border-white shadow-sm">
                      <AvatarFallback className="text-sm font-semibold text-white" style={{ backgroundColor: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">Workspace member</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-border/70 bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {member.assignedTasks.length} assigned
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-secondary px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Total
                    </div>
                    <p className="mt-2 text-xl font-semibold">{member.assignedTasks.length}</p>
                  </div>
                  <div className="rounded-xl bg-secondary px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CircleDot className="h-3.5 w-3.5 text-primary" />
                      Active
                    </div>
                    <p className="mt-2 text-xl font-semibold">{member.activeCount}</p>
                  </div>
                  <div className="rounded-xl bg-secondary px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5 text-emerald-500" />
                      Done
                    </div>
                    <p className="mt-2 text-xl font-semibold">{member.completedCount}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Assigned Projects</p>
                  <div className="space-y-2">
                    {member.assignedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-xl border border-border/70 bg-secondary px-3 py-2">
                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {task.status === "completed" ? "Completed" : task.status === "inprogress" ? "In progress" : "Todo"}
                        </p>
                      </div>
                    ))}
                    {member.assignedTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground">
                        No assigned projects yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
