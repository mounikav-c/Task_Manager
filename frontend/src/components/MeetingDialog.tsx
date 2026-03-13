import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
}

interface MeetingFormData {
  title: string;
  agenda: string;
  scheduledFor: string;
  durationMinutes: number;
  location: string;
  meetingLink: string;
  status: "scheduled" | "completed" | "cancelled";
  projectId?: string;
  organizerId?: string;
  attendeeIds: string[];
}

interface MeetingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (meeting: MeetingFormData) => void;
  teamMembers: Assignee[];
  projects: Project[];
  meeting?: (MeetingFormData & { id: string }) | null;
}

function toDateTimeLocal(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function MeetingDialog({ open, onClose, onSave, teamMembers, projects, meeting }: MeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [projectId, setProjectId] = useState("");
  const [organizerId, setOrganizerId] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (meeting) {
      setTitle(meeting.title);
      setAgenda(meeting.agenda);
      setScheduledFor(toDateTimeLocal(meeting.scheduledFor));
      setDurationMinutes(String(meeting.durationMinutes));
      setLocation(meeting.location);
      setMeetingLink(meeting.meetingLink);
      setStatus(meeting.status);
      setProjectId(meeting.projectId ?? "");
      setOrganizerId(meeting.organizerId ?? "");
      setAttendeeIds(meeting.attendeeIds);
      return;
    }

    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);

    setTitle("");
    setAgenda("");
    setScheduledFor(toDateTimeLocal(nextHour.toISOString()));
    setDurationMinutes("30");
    setLocation("");
    setMeetingLink("");
    setStatus("scheduled");
    setProjectId("");
    setOrganizerId(teamMembers[0]?.id ?? "");
    setAttendeeIds([]);
  }, [meeting, open, teamMembers]);

  const organizerName = useMemo(
    () => teamMembers.find((member) => member.id === organizerId)?.name,
    [organizerId, teamMembers],
  );

  const toggleAttendee = (memberId: string, checked: boolean) => {
    setAttendeeIds((current) => {
      if (checked) {
        return current.includes(memberId) ? current : [...current, memberId];
      }

      return current.filter((id) => id !== memberId);
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !scheduledFor) {
      return;
    }

    onSave({
      title: title.trim(),
      agenda: agenda.trim(),
      scheduledFor: new Date(scheduledFor).toISOString(),
      durationMinutes: Number(durationMinutes) || 30,
      location: location.trim(),
      meetingLink: meetingLink.trim(),
      status,
      projectId: projectId || undefined,
      organizerId: organizerId || undefined,
      attendeeIds,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Meeting Title</Label>
                <Input id="meeting-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sprint planning, review, handoff..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-agenda">Agenda</Label>
                <Textarea
                  id="meeting-agenda"
                  value={agenda}
                  onChange={(event) => setAgenda(event.target.value)}
                  placeholder="What should the team cover in this meeting?"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-time">Date & Time</Label>
                  <Input id="meeting-time" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">Duration</Label>
                  <Input
                    id="meeting-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-location">Location</Label>
                  <Input id="meeting-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Conference room / Google Meet" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-link">Meeting Link</Label>
                  <Input id="meeting-link" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="https://meet..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "scheduled" | "completed" | "cancelled")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId || "none"} onValueChange={(value) => setProjectId(value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Organizer</Label>
                <Select value={organizerId || "none"} onValueChange={(value) => setOrganizerId(value === "none" ? "" : value)}>
                  <SelectTrigger><SelectValue placeholder="Select organizer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No organizer</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizerName && <p className="text-xs text-muted-foreground">Organizer: {organizerName}</p>}
              </div>

              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-accent/35 p-3">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border/60 hover:bg-card/60">
                      <Checkbox
                        checked={attendeeIds.includes(member.id)}
                        onCheckedChange={(checked) => toggleAttendee(member.id, checked === true)}
                      />
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-primary-foreground"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </span>
                      <span className="text-sm font-medium text-foreground">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{meeting ? "Save Changes" : "Schedule Meeting"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
