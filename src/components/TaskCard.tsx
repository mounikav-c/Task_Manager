import { ArrowUpRight, Calendar, Pencil, Trash2 } from "lucide-react";
import type { Assignee, Task } from "@/lib/store";
import { getAssignee } from "@/lib/store";
import { motion } from "framer-motion";

const priorityLabel = { low: "Low", medium: "Medium", high: "High" } as const;
const statusLabel = { todo: "Todo", inprogress: "In Progress", completed: "Completed" } as const;
const fallbackPriority: keyof typeof priorityLabel = "medium";
const fallbackStatus: keyof typeof statusLabel = "todo";
const priorityBadgeClass: Record<keyof typeof priorityLabel, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  teamMembers: Assignee[];
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`task-card task-card-urgency-${priorityKey} group ${isCompleted ? "task-card-completed" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`task-card-title font-medium text-card-foreground ${compact ? "text-sm" : ""} ${isCompleted ? "text-card-foreground/80" : ""}`}>
              {task.title}
            </h3>
            <ArrowUpRight className="task-card-arrow h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
          {!compact && task.description && (
            <p className={`task-card-description text-sm mt-1 line-clamp-2 ${isCompleted ? "text-muted-foreground/90" : "text-muted-foreground"}`}>
              {task.description}
            </p>
          )}
        </div>
        <div className="task-card-actions flex gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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
              className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground shrink-0"
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
