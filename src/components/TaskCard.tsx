import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/lib/store";
import { motion } from "framer-motion";

const priorityLabel = { low: "Low", medium: "Medium", high: "High" } as const;
const statusLabel = { todo: "Todo", inprogress: "In Progress", completed: "Completed" } as const;

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, compact }: TaskCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="task-card group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-card-foreground ${compact ? "text-sm" : ""} ${task.status === "completed" ? "line-through opacity-60" : ""}`}>
            {task.title}
          </h3>
          {!compact && task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full priority-${task.priority}`}>
          {priorityLabel[task.priority]}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full status-${task.status}`}>
          {statusLabel[task.status]}
        </span>
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
