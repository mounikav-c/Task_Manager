import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api, type Project } from "@/lib/api";
import { useAuthUser } from "@/contexts/AuthUserContext";

type Status = "todo" | "inprogress" | "completed";
type Priority = "low" | "medium" | "high";

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
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
  projectId?: string;
  assigneeId?: string;
}

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, "id" | "createdAt">) => void;
  task?: Task | null;
  teamMembers: Assignee[];
  initialProjectId?: string;
}

const allowedProjectNames = new Set(["72ipo", "midas", "realestate"]);

export function TaskDialog({ open, onClose, onSave, task, teamMembers, initialProjectId }: TaskDialogProps) {
  const { selectedDepartmentId } = useAuthUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const uniqueProjects = useMemo(() => {
    const seen = new Set<string>();

    return projects.filter((project) => {
      const normalizedName = project.name.replace(/\s+/g, " ").trim().toLowerCase();
      const compactNormalizedName = normalizedName.replace(/\s+/g, "");

      if (!allowedProjectNames.has(compactNormalizedName)) {
        return false;
      }

      if (seen.has(compactNormalizedName)) {
        return false;
      }

      seen.add(compactNormalizedName);
      return true;
    });
  }, [projects]);

  useEffect(() => {
    if (!open) return;

    const loadProjects = async () => {
      try {
        const data = await api.getProjects(selectedDepartmentId);
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects", error);
      }
    };

    void loadProjects();
  }, [open, selectedDepartmentId]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setProjectId(task.projectId || "");
      setAssigneeId(task.assigneeId || "");
      return;
    }

    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(new Date().toISOString().split("T")[0]);
    setProjectId(initialProjectId || "");
    setAssigneeId("");
  }, [task, open, initialProjectId]);

  useEffect(() => {
    if (!task && !projectId && uniqueProjects.length > 0) {
      setProjectId(initialProjectId || String(uniqueProjects[0].id));
    }
  }, [uniqueProjects, projectId, task, initialProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, status, priority, dueDate, projectId, assigneeId: assigneeId || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due Date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId || "unassigned"} onValueChange={(v) => setAssigneeId(v === "unassigned" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full inline-flex items-center justify-center text-[8px] font-bold text-primary-foreground" style={{ backgroundColor: m.color }}>{m.initials}</span>
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{task ? "Save Changes" : "Create Task"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
