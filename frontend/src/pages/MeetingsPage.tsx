import { CalendarDays, Clock3, MapPin, Plus, Users } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface Meeting {
  id: string;
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

interface Props {
  meetings: Meeting[];
  projects: Project[];
  teamMembers: Assignee[];
  onAddMeeting: () => void;
  onEditMeeting: (meeting: Meeting) => void;
}

const statusTone = {
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
} satisfies Record<Meeting["status"], string>;

function formatMeetingDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getProjectName(projectId: string | undefined, projects: Project[]) {
  return projects.find((project) => project.id === projectId)?.name ?? "General";
}

export function MeetingsPage({ meetings, projects, teamMembers, onAddMeeting, onEditMeeting }: Props) {
  const now = Date.now();
  const upcomingMeetings = [...meetings]
    .filter((meeting) => new Date(meeting.scheduledFor).getTime() >= now && meeting.status === "scheduled")
    .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime());
  const todayMeetings = meetings.filter((meeting) => {
    const date = new Date(meeting.scheduledFor);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;
  const totalAttendees = new Set(upcomingMeetings.flatMap((meeting) => meeting.attendeeIds)).size;

  const statCards = [
    { label: "Upcoming", value: upcomingMeetings.length, icon: CalendarDays },
    { label: "Today", value: todayMeetings, icon: Clock3 },
    { label: "People", value: totalAttendees, icon: Users },
  ];

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Meetings" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="space-y-4">
          <section className="dashboard-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Meeting Schedule</h2>
                <p className="mt-1 text-sm text-muted-foreground">Plan reviews, handoffs, and team syncs in one place.</p>
              </div>
              <Button onClick={onAddMeeting} className="h-10 rounded-xl bg-gradient-to-r from-primary via-fuchsia-500/95 to-violet-500 px-4 text-sm font-medium text-primary-foreground shadow-[0_18px_35px_-20px_hsl(var(--primary)/0.85)]">
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="rounded-[1.1rem] border border-white/45 bg-white/60 px-4 py-3 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.24)] backdrop-blur">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                    {stat.label}
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming Meetings</h2>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-accent/45 px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No meetings scheduled yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Use Schedule Meeting to add your first team session.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {upcomingMeetings.map((meeting) => {
                  const attendees = teamMembers.filter((member) => meeting.attendeeIds.includes(member.id));
                  const organizer = teamMembers.find((member) => member.id === meeting.organizerId);

                  return (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => onEditMeeting(meeting)}
                      className="rounded-[1.2rem] border border-white/45 bg-white/60 p-4 text-left shadow-[0_16px_32px_-30px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-white/80 hover:shadow-[0_22px_40px_-34px_rgba(15,23,42,0.28),var(--glow-primary)]"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold tracking-tight text-foreground">{meeting.title}</h3>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone[meeting.status]}`}>
                              {meeting.status}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-border/60 bg-accent/65 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              {getProjectName(meeting.projectId, projects)}
                            </span>
                          </div>

                          {meeting.agenda && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{meeting.agenda}</p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatMeetingDate(meeting.scheduledFor)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {meeting.durationMinutes} min
                            </span>
                            {meeting.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {meeting.location}
                              </span>
                            )}
                            {organizer && (
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Organized by {organizer.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {attendees.slice(0, 4).map((member) => (
                              <Avatar key={member.id} className="h-8 w-8 border-2 border-white ring-0">
                                <AvatarFallback className="text-[10px] font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                                  {member.initials}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {attendees.length > 4 && (
                            <span className="text-xs font-medium text-muted-foreground">+{attendees.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
