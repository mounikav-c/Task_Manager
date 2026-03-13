import { AlertCircle } from "lucide-react";
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

type MeetingFormErrors = Partial<Record<keyof MeetingFormData, string>>;

const validationFieldClass = "shadow-[inset_0_-1px_0_rgba(251,113,133,0.9)]";
const validationTextClass = "inline-flex items-center gap-1 text-[0.72rem] font-medium leading-4 text-rose-400";
const baseFieldClass = "h-11 rounded-[12px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(245,240,255,0.97)_100%)] text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-0 focus-visible:shadow-[inset_0_0_0_1px_rgba(139,92,246,0.28)]";
const attendeeListClass = "max-h-64 space-y-3 overflow-y-auto rounded-[12px] bg-white/70 p-1 [scrollbar-width:thin] [scrollbar-color:rgba(139,92,246,0.22)_transparent] [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(139,92,246,0.22)]";
const panelFieldClass = "rounded-[12px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(245,240,255,0.97)_100%)] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)]";

interface MeetingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (meeting: MeetingFormData) => Promise<void>;
  isSaving?: boolean;
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

export function MeetingDialog({ open, onClose, onSave, isSaving = false, teamMembers, projects, meeting }: MeetingDialogProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<MeetingFormErrors>({});

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
      setErrors({});
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
    setIsSubmitting(false);
    setErrors({});
  }, [meeting, open, teamMembers]);

  const organizerName = useMemo(
    () => teamMembers.find((member) => member.id === organizerId)?.name,
    [organizerId, teamMembers],
  );

  const toggleAttendee = (memberId: string, checked: boolean) => {
    setErrors((current) => ({ ...current, attendeeIds: undefined }));
    setAttendeeIds((current) => {
      if (checked) {
        return current.includes(memberId) ? current : [...current, memberId];
      }

      return current.filter((id) => id !== memberId);
    });
  };

  const validateForm = () => {
    const nextErrors: MeetingFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = "Meeting title is required.";
    }

    if (!agenda.trim()) {
      nextErrors.agenda = "Agenda is required.";
    }

    if (!scheduledFor) {
      nextErrors.scheduledFor = "Date and time are required.";
    }

    if (!durationMinutes || Number(durationMinutes) <= 0) {
      nextErrors.durationMinutes = "Enter a valid duration.";
    }

    if (!location.trim()) {
      nextErrors.location = "Location is required.";
    }

    if (!meetingLink.trim()) {
      nextErrors.meetingLink = "Meeting link is required.";
    }

    if (!organizerId) {
      nextErrors.organizerId = "Organizer is required.";
    }

    if (attendeeIds.length === 0) {
      nextErrors.attendeeIds = "Select at least one attendee.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || isSaving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[12px] font-sans sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[1.9rem] font-extrabold tracking-tight [font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]">{meeting ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-title">Meeting Title</Label>
                <Input
                  id="meeting-title"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setErrors((current) => ({ ...current, title: undefined }));
                  }}
                  placeholder="Sprint planning, review, handoff..."
                  className={`${baseFieldClass} ${errors.title ? validationFieldClass : ""}`}
                />
                {errors.title && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-agenda">Agenda</Label>
                <Textarea
                  id="meeting-agenda"
                  value={agenda}
                  onChange={(event) => {
                    setAgenda(event.target.value);
                    setErrors((current) => ({ ...current, agenda: undefined }));
                  }}
                  placeholder="What should the team cover in this meeting?"
                  rows={5}
                  className={`min-h-[132px] rounded-[12px] border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(245,240,255,0.97)_100%)] text-slate-700 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)] resize-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:ring-offset-0 focus-visible:shadow-[inset_0_0_0_1px_rgba(139,92,246,0.28)] ${errors.agenda ? validationFieldClass : ""}`}
                />
                {errors.agenda && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.agenda}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-time">Date & Time</Label>
                  <Input
                    id="meeting-time"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(event) => {
                      setScheduledFor(event.target.value);
                      setErrors((current) => ({ ...current, scheduledFor: undefined }));
                    }}
                    className={`${baseFieldClass} ${errors.scheduledFor ? validationFieldClass : ""}`}
                  />
                  {errors.scheduledFor && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.scheduledFor}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">Duration</Label>
                  <Input
                    id="meeting-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(event) => {
                      setDurationMinutes(event.target.value);
                      setErrors((current) => ({ ...current, durationMinutes: undefined }));
                    }}
                    className={`${baseFieldClass} ${errors.durationMinutes ? validationFieldClass : ""}`}
                  />
                  {errors.durationMinutes && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.durationMinutes}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting-location">Location</Label>
                  <Input
                    id="meeting-location"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setErrors((current) => ({ ...current, location: undefined }));
                    }}
                    placeholder="Conference room / Google Meet"
                    className={`${baseFieldClass} ${errors.location ? validationFieldClass : ""}`}
                  />
                  {errors.location && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.location}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-link">Meeting Link</Label>
                  <Input
                    id="meeting-link"
                    value={meetingLink}
                    onChange={(event) => {
                      setMeetingLink(event.target.value);
                      setErrors((current) => ({ ...current, meetingLink: undefined }));
                    }}
                    placeholder="https://meet..."
                    className={`${baseFieldClass} ${errors.meetingLink ? validationFieldClass : ""}`}
                  />
                  {errors.meetingLink && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.meetingLink}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as "scheduled" | "completed" | "cancelled")}>
                  <SelectTrigger className={baseFieldClass}><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className={baseFieldClass}><SelectValue placeholder="Select project" /></SelectTrigger>
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
                <Select
                  value={organizerId || "none"}
                  onValueChange={(value) => {
                    setOrganizerId(value === "none" ? "" : value);
                    setErrors((current) => ({ ...current, organizerId: undefined }));
                  }}
                >
                  <SelectTrigger className={baseFieldClass}><SelectValue placeholder="Select organizer" /></SelectTrigger>
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
                {errors.organizerId && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.organizerId}</p>}
              </div>

              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className={`${attendeeListClass} ${errors.attendeeIds ? validationFieldClass : panelFieldClass}`}>
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-violet-50/70">
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
                {errors.attendeeIds && <p className={validationTextClass}><AlertCircle className="h-3 w-3" />{errors.attendeeIds}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isSaving} className="rounded-[12px]">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="rounded-[12px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_18px_rgba(139,92,246,0.16),0_10px_24px_-16px_rgba(139,92,246,0.38)] hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-400"
            >
              {isSubmitting || isSaving ? (meeting ? "Saving..." : "Scheduling...") : meeting ? "Save Changes" : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
