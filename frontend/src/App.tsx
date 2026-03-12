import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { TasksPage } from "@/pages/TasksPage";
import { BoardPage } from "@/pages/BoardPage";
import { MembersPage } from "@/pages/MembersPage";
import { ProjectDetailsPage } from "@/pages/ProjectDetailsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { HelpPage } from "@/pages/HelpPage";
import { TaskDialog } from "@/components/TaskDialog";
import { MemberDialog } from "@/components/MemberDialog";
import { useTaskStore, type Task, type Status } from "@/lib/store";
import { useState, useCallback } from "react";
import NotFound from "./pages/NotFound";

const App = () => {
  const { tasks, teamMembers, addTask, updateTask, deleteTask, addTeamMember } = useTaskStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialProjectId, setInitialProjectId] = useState<string | undefined>(undefined);

  const handleNew = useCallback((projectId?: string) => {
    setEditingTask(null);
    setInitialProjectId(projectId);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setInitialProjectId(undefined);
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

  const handleAddMember = useCallback((name: string) => {
    addTeamMember(name);
  }, [addTeamMember]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("taskflow-tasks");
    localStorage.removeItem("taskflow-team-members");
    sessionStorage.clear();
    window.location.reload();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="app-shell min-h-screen flex w-full bg-background p-2 md:p-4">
            <AppSidebar onAddProject={handleNew} onAddMember={() => setMemberDialogOpen(true)} onLogout={handleLogout} />
            <SidebarInset className="app-shell-main min-w-0 overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/50 shadow-[0_24px_70px_-58px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <Routes>
                <Route path="/" element={<DashboardPage tasks={tasks} teamMembers={teamMembers} onEdit={handleEdit} onDelete={deleteTask} onAddProject={handleNew} onNew={handleNew} onAddMember={() => setMemberDialogOpen(true)} />} />
                <Route path="/tasks" element={<TasksPage tasks={tasks} teamMembers={teamMembers} onEdit={handleEdit} onDelete={deleteTask} onNew={handleNew} />} />
                <Route path="/board" element={<BoardPage tasks={tasks} teamMembers={teamMembers} onEdit={handleEdit} onDelete={deleteTask} onNew={handleNew} onUpdateStatus={handleUpdateStatus} />} />
                <Route path="/projects/:projectId" element={<ProjectDetailsPage tasks={tasks} teamMembers={teamMembers} onEdit={handleEdit} onNew={handleNew} />} />
                <Route path="/members" element={<MembersPage tasks={tasks} teamMembers={teamMembers} onAddMember={() => setMemberDialogOpen(true)} />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </BrowserRouter>
      <TaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setInitialProjectId(undefined);
        }}
        onSave={handleSave}
        task={editingTask}
        teamMembers={teamMembers}
        initialProjectId={initialProjectId}
      />
      <MemberDialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} onSave={handleAddMember} />
    </TooltipProvider>
  );
};

export default App;
