import { CalendarDays, Clock3, MapPin, Plus, Users } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/contexts/AuthUserContext";

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

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  createdAt: string;
  projectId?: string;
  assigneeId?: string;
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
  tasks: Task[];
  projects: Project[];
  teamMembers: Assignee[];
  onAddMeeting: () => void;
  onEditMeeting: (meeting: Meeting) => void;
}

const statusTone = {
  scheduled: "border-indigo-200/80 bg-[linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.06))] text-indigo-700",
  completed: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.04))] text-emerald-700",
  cancelled: "border-rose-200/80 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(225,29,72,0.04))] text-rose-700",
} satisfies Record<Meeting["status"], string>;

const projectTone = [
  "border-violet-200/80 bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(168,85,247,0.04))] text-violet-700",
  "border-indigo-200/80 bg-[linear-gradient(135deg,rgba(99,102,241,0.12),rgba(129,140,248,0.04))] text-indigo-700",
  "border-fuchsia-200/80 bg-[linear-gradient(135deg,rgba(217,70,239,0.12),rgba(232,121,249,0.04))] text-fuchsia-700",
  "border-sky-200/80 bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(14,165,233,0.04))] text-sky-700",
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

function getProjectStatus(projectTasks: Task[]) {
  const totalCount = projectTasks.length;
  const completedCount = projectTasks.filter((task) => task.status === "completed").length;
  const inProgressCount = projectTasks.filter((task) => task.status === "inprogress").length;
  const openCount = totalCount - completedCount;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  let note = "No tasks yet";
  if (openCount > 0) {
    note = openCount === 1 ? "1 task open" : `${openCount} tasks open`;
  }
  if (inProgressCount > 0) {
    note = inProgressCount === 1 ? "1 task in progress" : `${inProgressCount} tasks in progress`;
  }
  if (totalCount > 0 && completedCount === totalCount) {
    note = "All tasks completed";
  }

  const badge = completedCount === totalCount && totalCount > 0
    ? { label: "Completed", tone: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700" }
    : inProgressCount > 0
      ? { label: "In Progress", tone: "border-amber-200/80 bg-amber-50/80 text-amber-700" }
      : openCount > 0
        ? { label: "Starting", tone: "border-sky-200/80 bg-sky-50/80 text-sky-700" }
        : { label: "No Tasks", tone: "border-slate-200/80 bg-slate-50/80 text-slate-600" };

  return { progress, note, badge, totalCount };
}

function MeetingDurationRing({ durationMinutes }: { durationMinutes: number }) {
  const maxDuration = 60;
  const ratio = Math.min(durationMinutes / maxDuration, 1);
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center rounded-full border border-indigo-100/80 bg-white/70 shadow-[0_14px_28px_-22px_rgba(79,70,229,0.35)] backdrop-blur"
      aria-label={`Meeting duration ${durationMinutes} minutes out of ${maxDuration} minutes`}
      title={`Duration: ${durationMinutes} min`}
    >
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="url(#meeting-duration-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="meeting-duration-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-indigo-400">Min</span>
        <span className="mt-1 text-[11px] font-extrabold tracking-tight text-indigo-700">{durationMinutes}</span>
      </div>
    </div>
  );
}

export function MeetingsPage({ meetings, tasks, projects, teamMembers, onAddMeeting, onEditMeeting }: Props) {
  const { canEditSelectedDepartment } = useAuthUser();
  const now = Date.now();
  const upcomingMeetings = [...meetings]
    .filter((meeting) => new Date(meeting.scheduledFor).getTime() >= now && meeting.status === "scheduled")
    .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime());

  const todayMeetings = upcomingMeetings.filter((meeting) => {
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

  const projectSummaries = projects.slice(0, 4).map((project) => ({
    ...project,
    ...getProjectStatus(tasks.filter((task) => task.projectId === project.id)),
  }));

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Meetings" />
      <div className="flex-1 overflow-auto p-4 md:p-5">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4">
          <section className="overflow-hidden rounded-[1.55rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.58)_55%,rgba(238,242,255,0.62))] px-5 py-5 shadow-[0_28px_70px_-48px_rgba(15,23,42,0.24),0_18px_44px_-34px_rgba(79,70,229,0.09),inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center rounded-full border border-indigo-300/30 bg-[linear-gradient(135deg,rgba(79,70,229,0.1),rgba(99,102,241,0.04))] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
                    Meetings Hub
                  </span>
                  <h1 className="mt-3 bg-[linear-gradient(135deg,#312e81_0%,#4338ca_52%,#5b21b6_100%)] bg-clip-text text-[2rem] font-extrabold tracking-tight text-transparent">Meeting Schedule</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Keep reviews, handoffs, and team syncs organized in one compact workspace.
                  </p>
                </div>
                <Button
                  onClick={onAddMeeting}
                  disabled={!canEditSelectedDepartment}
                  className="h-10 shrink-0 self-start rounded-xl bg-[linear-gradient(135deg,#4338ca_0%,#5b21b6_100%)] px-4 text-sm font-medium text-white shadow-[0_18px_35px_-20px_rgba(79,70,229,0.45)] hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                  Schedule Meeting
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.05rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(243,244,255,0.54))] px-4 py-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.64)] backdrop-blur"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <stat.icon className="h-3.5 w-3.5 text-indigo-600" />
                      {stat.label}
                    </div>
                    <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.7fr)]">
            <section className="dashboard-panel !border-white/50 !bg-[linear-gradient(135deg,rgba(255,255,255,0.76),rgba(243,244,255,0.52))] !p-4 !shadow-[0_28px_70px_-56px_rgba(15,23,42,0.22),0_18px_44px_-34px_rgba(79,70,229,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Upcoming Meetings</h2>
              </div>

              {upcomingMeetings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-accent/45 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-foreground">No meetings scheduled yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Use Schedule Meeting to add your first team session.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {upcomingMeetings.map((meeting, index) => {
                    const attendees = teamMembers.filter((member) => meeting.attendeeIds.includes(member.id));
                    const organizer = teamMembers.find((member) => member.id === meeting.organizerId);
                    const projectBadgeTone = projectTone[index % projectTone.length];

                    return (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => onEditMeeting(meeting)}
                        className="rounded-[1.2rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(245,243,255,0.56))] p-5 text-left shadow-[0_30px_70px_-54px_rgba(15,23,42,0.28),0_18px_42px_-32px_rgba(79,70,229,0.1),inset_0_1px_0_rgba(255,255,255,0.56)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200/55 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(243,244,255,0.62))] hover:shadow-[0_34px_76px_-54px_rgba(15,23,42,0.3),0_20px_48px_-34px_rgba(79,70,229,0.12)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[1.05rem] font-extrabold tracking-tight text-slate-900">{meeting.title}</h3>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone[meeting.status]}`}>
                                {meeting.status}
                              </span>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${projectBadgeTone}`}>
                                {getProjectName(meeting.projectId, projects)}
                              </span>
                            </div>

                            {meeting.agenda && (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{meeting.agenda}</p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-start gap-3 pr-1">
                            <div className="flex -space-x-3">
                              {attendees.slice(0, 4).map((member) => (
                                <Avatar key={member.id} className="h-8 w-8 border-2 border-white ring-0 shadow-[0_8px_18px_-12px_rgba(15,23,42,0.4)]">
                                  <AvatarFallback className="text-[10px] font-semibold text-primary-foreground" style={{ backgroundColor: member.color }}>
                                    {member.initials}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <MeetingDurationRing durationMinutes={meeting.durationMinutes} />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2.5 text-xs text-muted-foreground sm:grid-cols-2">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(238,242,255,0.8),rgba(245,243,255,0.82))] px-3 py-2.5">
                            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                            {formatMeetingDate(meeting.scheduledFor)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(238,242,255,0.8),rgba(245,243,255,0.82))] px-3 py-2.5">
                            <Clock3 className="h-3.5 w-3.5 text-violet-500" />
                            {meeting.durationMinutes} min
                          </span>
                          {meeting.location && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(238,242,255,0.8),rgba(245,243,255,0.82))] px-3 py-2.5 sm:col-span-2">
                              <MapPin className="h-3.5 w-3.5 text-violet-500" />
                              {meeting.location}
                            </span>
                          )}
                        </div>

                        {organizer && (
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
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

            <aside className="dashboard-panel !border-white/50 !bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(243,244,255,0.58))] !p-4 !shadow-[0_28px_70px_-56px_rgba(15,23,42,0.22),0_18px_44px_-34px_rgba(79,70,229,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Projects</h2>
                <p className="mt-1 text-xs text-muted-foreground">Live progress based on linked task completion.</p>
              </div>

              <div className="space-y-3">
                {projectSummaries.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-[1.1rem] border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(245,243,255,0.55))] p-4 shadow-[0_24px_44px_-38px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.68)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{project.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{project.note}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-bold ${project.badge.tone}`}>
                        {project.badge.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-muted-foreground">
                          {project.totalCount === 0 ? "No tracked tasks" : `${project.totalCount} tracked task${project.totalCount === 1 ? "" : "s"}`}
                        </span>
                        <span className="font-bold text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200/70">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#4338ca_0%,#7c3aed_100%)] transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
