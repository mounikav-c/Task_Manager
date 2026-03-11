import { Plus } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import type { Task, Status } from "@/lib/store";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

const columns: { id: Status; label: string; colorClass: string }[] = [
  { id: "todo", label: "Todo", colorClass: "bg-muted-foreground" },
  { id: "inprogress", label: "In Progress", colorClass: "bg-status-inprogress" },
  { id: "completed", label: "Completed", colorClass: "bg-status-completed" },
];

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onUpdateStatus: (id: string, status: Status) => void;
}

export function BoardPage({ tasks, onEdit, onDelete, onNew, onUpdateStatus }: Props) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as Status;
    onUpdateStatus(result.draggableId, newStatus);
  };

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Board" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">Kanban Board</p>
          <Button onClick={onNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="bg-secondary/50 rounded-xl p-3 min-h-[300px]">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${col.colorClass}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{colTasks.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? "opacity-90" : ""}
                              >
                                <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} compact />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
