import { Plus } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/store";
import { AnimatePresence } from "framer-motion";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function TasksPage({ tasks, onEdit, onDelete, onNew }: Props) {
  return (
    <div className="flex flex-col h-full">
      <TopNav title="Tasks" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
