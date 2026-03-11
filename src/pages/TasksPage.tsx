import { Plus, X } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task } from "@/lib/store";
import { TEAM_MEMBERS, getAssignee } from "@/lib/store";
import { AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function TasksPage({ tasks, onEdit, onDelete, onNew }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const assigneeFilter = searchParams.get("assignee") || "all";

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let result = tasks;

    if (filter === "completed") result = result.filter((t) => t.status === "completed");
    else if (filter === "pending") result = result.filter((t) => t.status === "todo" || t.status === "inprogress");
    else if (filter === "overdue") result = result.filter((t) => t.dueDate < today && t.status !== "completed");

    if (assigneeFilter !== "all") result = result.filter((t) => t.assigneeId === assigneeFilter);

    return result;
  }, [tasks, filter, assigneeFilter]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    setSearchParams(params, { replace: true });
  };

  const hasFilters = filter !== "all" || assigneeFilter !== "all";
  const filterLabel = { all: "All", completed: "Completed", pending: "Pending", overdue: "Overdue" }[filter] || "All";

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Tasks" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks</p>

            <Select value={filter} onValueChange={(v) => setFilter("filter", v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={(v) => setFilter("assignee", v)}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {TEAM_MEMBERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setSearchParams({}, { replace: true })}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No tasks match the current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
