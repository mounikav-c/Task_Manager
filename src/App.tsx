import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import { BoardPage } from "@/pages/BoardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TaskDialog } from "@/components/TaskDialog";
import { useTaskStore, type Task, type Status } from "@/lib/store";
import { useState, useCallback } from "react";
import NotFound from "./pages/NotFound";

const App = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleNew = useCallback(() => {
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: Omit<Task, "id" | "createdAt">) => {
      if (editingTask) {
        updateTask(editingTask.id, data);
      } else {
        addTask(data);
      }
    },
    [editingTask, updateTask, addTask]
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: Status) => {
      updateTask(id, { status });
    },
    [updateTask]
  );

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Routes>
                <Route path="/" element={<DashboardPage tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} />} />
                <Route path="/tasks" element={<TasksPage tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} onNew={handleNew} />} />
                <Route path="/board" element={<BoardPage tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} onNew={handleNew} onUpdateStatus={handleUpdateStatus} />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
      <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} task={editingTask} />
    </TooltipProvider>
  );
};

export default App;
