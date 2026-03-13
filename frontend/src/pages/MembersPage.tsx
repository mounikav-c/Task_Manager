import { BriefcaseBusiness, CircleDot, Plus, UserRound } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

interface Props {
  tasks: Task[];
  teamMembers: Assignee[];
  onAddMember: () => void;
}

export function MembersPage({ tasks, teamMembers, onAddMember }: Props) {
  const navigate = useNavigate();
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
        <div className="dashboard-panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Team Members</h2>
            </div>
            <Button onClick={onAddMember} className="rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 text-sm h-9">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </div>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            {members.map((member, index) => (
              <motion.button
                key={member.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.04 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/members/${member.id}`)}
                className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:border-primary/20 hover:shadow-[0_18px_35px_-28px_rgba(15,23,42,0.28)]"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 ring-1 ring-border/30">
                      <AvatarFallback className="text-xs font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-foreground">{member.name}</h3>
                      <p className="text-xs text-muted-foreground">Workspace member</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-border/50 bg-accent px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {member.assignedTasks.length} assigned
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-accent px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <BriefcaseBusiness className="h-3 w-3" />
                      Total
                    </div>
                    <p className="mt-1 text-lg font-semibold">{member.assignedTasks.length}</p>
                  </div>
                  <div className="rounded-lg bg-accent px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CircleDot className="h-3 w-3 text-primary" />
                      Active
                    </div>
                    <p className="mt-1 text-lg font-semibold">{member.activeCount}</p>
                  </div>
                  <div className="rounded-lg bg-accent px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <UserRound className="h-3 w-3 text-emerald-400" />
                      Done
                    </div>
                    <p className="mt-1 text-lg font-semibold">{member.completedCount}</p>
                  </div>
                </div>

                <div className="mt-4 flex-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Assigned Tasks</p>
                  <div className="space-y-1.5">
                    {member.assignedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded-lg border border-border/50 bg-accent/80 px-3 py-2">
                        <p className="truncate text-xs font-medium text-foreground">{task.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {task.status === "completed" ? "Completed" : task.status === "inprogress" ? "In progress" : "Todo"}
                        </p>
                      </div>
                    ))}
                    {member.assignedTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/50 px-3 py-3 text-xs text-muted-foreground">
                        No assigned tasks yet.
                      </div>
                    )}
                    {member.assignedTasks.length > 0 && member.assignedTasks.length < 2 && (
                      <div className="min-h-[3.75rem]" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
