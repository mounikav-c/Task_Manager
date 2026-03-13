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

const projectTone = [
  "border-violet-200 bg-violet-50 text-violet-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-amber-200 bg-amber-50 text-amber-700",
];

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
  const featuredMeeting = upcomingMeetings[0];

  const statCards = [
    { label: "Upcoming", value: upcomingMeetings.length, icon: CalendarDays },
    { label: "Today", value: todayMeetings, icon: Clock3 },
    { label: "People", value: totalAttendees, icon: Users },
  ];

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Meetings" />
      <div className="flex-1 overflow-auto p-4 md:p-5">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4">
          <section className="overflow-hidden rounded-[1.55rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.9))] px-5 py-5 shadow-[0_22px_48px_-36px_rgba(15,23,42,0.3),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-start">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Meetings Hub
                </span>
                <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-foreground">Meeting Schedule</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Keep reviews, handoffs, and team syncs organized in one compact workspace.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {statCards.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[1.05rem] border border-white/45 bg-white/72 px-4 py-3 shadow-[0_14px_30px_-28px_rgba(15,23,42,0.22)] backdrop-blur"
                    >
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <stat.icon className="h-3.5 w-3.5 text-primary" />
                        {stat.label}
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/45 bg-white/70 p-4 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.25)] backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next Meeting</p>
                    <p className="mt-2 truncate text-lg font-semibold tracking-tight text-foreground">
                      {featuredMeeting ? featuredMeeting.title : "No meeting yet"}
                    </p>
                  </div>
                  <Button
                    onClick={onAddMeeting}
                    className="h-10 shrink-0 rounded-xl bg-gradient-to-r from-primary via-fuchsia-500/95 to-violet-500 px-4 text-sm font-medium text-primary-foreground shadow-[0_18px_35px_-20px_hsl(var(--primary)/0.85)]"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </div>

                {featuredMeeting ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone[featuredMeeting.status]}`}>
                        {featuredMeeting.status}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${projectTone[Number(featuredMeeting.projectId ?? "0") % projectTone.length]}`}>
                        {getProjectName(featuredMeeting.projectId, projects)}
                      </span>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatMeetingDate(featuredMeeting.scheduledFor)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2">
                        <Clock3 className="h-3.5 w-3.5" />
                        {featuredMeeting.durationMinutes} min
                      </span>
                      {featuredMeeting.location && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2 sm:col-span-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {featuredMeeting.location}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Schedule your first team session to start building the calendar.</p>
                )}
              </div>
            </div>
          </section>

          <section className="dashboard-panel !p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Upcoming Meetings</h2>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-accent/45 px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No meetings scheduled yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Use Schedule Meeting to add your first team session.</p>
              </div>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {upcomingMeetings.map((meeting, index) => {
                  const attendees = teamMembers.filter((member) => meeting.attendeeIds.includes(member.id));
                  const organizer = teamMembers.find((member) => member.id === meeting.organizerId);
                  const projectBadgeTone = projectTone[index % projectTone.length];

                  return (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => onEditMeeting(meeting)}
                      className="rounded-[1.2rem] border border-white/45 bg-white/65 p-4 text-left shadow-[0_16px_32px_-30px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-white/80 hover:shadow-[0_22px_40px_-34px_rgba(15,23,42,0.28),var(--glow-primary)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-[1.02rem] font-semibold tracking-tight text-foreground">{meeting.title}</h3>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone[meeting.status]}`}>
                              {meeting.status}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${projectBadgeTone}`}>
                              {getProjectName(meeting.projectId, projects)}
                            </span>
                          </div>

                          {meeting.agenda && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{meeting.agenda}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 -space-x-2">
                          {attendees.slice(0, 4).map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-white ring-0 shadow-sm">
                              <AvatarFallback className="text-[10px] font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatMeetingDate(meeting.scheduledFor)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2">
                          <Clock3 className="h-3.5 w-3.5" />
                          {meeting.durationMinutes} min
                        </span>
                        {meeting.location && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/55 px-2.5 py-2 sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {meeting.location}
                          </span>
                        )}
                      </div>

                      {organizer && (
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                          <span className="text-xs text-muted-foreground">Organized by {organizer.name}</span>
                          {attendees.length > 4 && (
                            <span className="text-xs font-medium text-muted-foreground">+{attendees.length - 4} more</span>
                          )}
                        </div>
                      )}
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
