import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: {
    name: string;
    description: string;
    summary: string;
    startDate: string;
    deadline: string;
    status: "Planning" | "Active" | "At Risk" | "Completed";
    progress: number;
    ownerId?: string;
    }) => void;
  teamMembers: Assignee[];
  project?: {
    id: string;
    name: string;
    description: string;
    summary: string;
    startDate: string;
    deadline: string;
    status: "Planning" | "Active" | "At Risk" | "Completed";
    progress: number;
    ownerId?: string;
  } | null;
}

export function ProjectDialog({ open, onClose, onSave, teamMembers, project }: ProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"Planning" | "Active" | "At Risk" | "Completed">("Planning");
  const [progress, setProgress] = useState("0");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    if (!open) return;

    if (project) {
      setName(project.name);
      setDescription(project.description);
      setSummary(project.summary);
      setStartDate(project.startDate);
      setDeadline(project.deadline);
      setStatus(project.status);
      setProgress(String(project.progress));
      setOwnerId(project.ownerId ?? "");
      return;
    }

    setName("");
    setDescription("");
    setSummary("");
    setStartDate("");
    setDeadline("");
    setStatus("Planning");
    setProgress("0");
    setOwnerId("");
  }, [open, project]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      summary: summary.trim(),
      startDate,
      deadline,
      status,
      progress: Number(progress) || 0,
      ownerId: ownerId || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter project name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short project description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-summary">Summary</Label>
            <Textarea
              id="project-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Project summary for the details page"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="project-start-date">Start Date</Label>
              <Input id="project-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input id="project-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as "Planning" | "Active" | "At Risk" | "Completed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-progress">Progress</Label>
              <Input
                id="project-progress"
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => setProgress(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Owner</Label>
            <Select value={ownerId || "unassigned"} onValueChange={(value) => setOwnerId(value === "unassigned" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{project ? "Save Changes" : "Create Project"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
