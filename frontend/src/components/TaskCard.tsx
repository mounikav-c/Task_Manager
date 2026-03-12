import { ArrowUpRight, Calendar, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { KeyboardEvent } from "react";

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

const priorityLabel = { low: "Low", medium: "Medium", high: "High" } as const;
const statusLabel = { todo: "Todo", inprogress: "In Progress", completed: "Completed" } as const;
const fallbackPriority: keyof typeof priorityLabel = "medium";
const fallbackStatus: keyof typeof statusLabel = "todo";
const priorityBadgeClass: Record<keyof typeof priorityLabel, string> = {
  high: "border-rose-500/30 bg-rose-500/15 text-rose-400",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  low: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  teamMembers: Assignee[];
}

function getAssignee(id: string | undefined, teamMembers: Assignee[]) {
  return teamMembers.find((member) => member.id === id);
}

export function TaskCard({ task, onEdit, onDelete, compact, teamMembers }: TaskCardProps) {
  const assignee = getAssignee(task.assigneeId, teamMembers);
  const isCompleted = task.status === "completed";
  const priorityKey = (String(task.priority).toLowerCase() in priorityLabel
    ? String(task.priority).toLowerCase()
    : fallbackPriority) as keyof typeof priorityLabel;
  const statusKey = (String(task.status).toLowerCase() in statusLabel
    ? String(task.status).toLowerCase()
    : fallbackStatus) as keyof typeof statusLabel;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit(task);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="button"
      tabIndex={0}
      onClick={() => onEdit(task)}
      onKeyDown={handleCardKeyDown}
      className={`task-card task-card-urgency-${priorityKey} group ${isCompleted ? "task-card-completed" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`task-card-title font-medium text-card-foreground ${compact ? "text-sm" : ""}`}>
              {task.title}
            </h3>
            <ArrowUpRight className="task-card-arrow h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
          {!compact && task.description && (
            <p className={`task-card-description text-sm mt-1 line-clamp-2 ${isCompleted ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
              {task.description}
            </p>
          )}
        </div>
        <div className="task-card-actions flex gap-0.5 shrink-0">
          <button onClick={(event) => { event.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={(event) => { event.stopPropagation(); onDelete(task.id); }} className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`priority-pill ${priorityBadgeClass[priorityKey]}`}>
          {priorityLabel[priorityKey]}
        </span>
        <span className={`status-pill status-${statusKey}`}>
          {statusLabel[statusKey]}
        </span>
        {assignee && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0 ring-1 ring-border/30"
              style={{ backgroundColor: assignee.color }}
            >
              {assignee.initials}
            </span>
            {!compact && assignee.name}
          </span>
        )}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
