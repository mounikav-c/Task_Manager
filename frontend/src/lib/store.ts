import { useState, useCallback } from "react";

export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "inprogress" | "completed";

export interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export const DEFAULT_TEAM_MEMBERS: Assignee[] = [
  { id: "1", name: "John Doe", initials: "JD", color: "hsl(162 63% 41%)" },
  { id: "2", name: "Sarah Chen", initials: "SC", color: "hsl(262 63% 51%)" },
  { id: "3", name: "Mike Ross", initials: "MR", color: "hsl(38 92% 50%)" },
  { id: "4", name: "Emma Wilson", initials: "EW", color: "hsl(340 65% 50%)" },
  { id: "5", name: "Alex Turner", initials: "AT", color: "hsl(200 70% 45%)" },
];

export interface Task {
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

const STORAGE_KEY = "taskflow-tasks";
const MEMBERS_STORAGE_KEY = "taskflow-team-members";
const TASK_SEED_VERSION_KEY = "taskflow-seed-version";
const TASK_SEED_VERSION = "v5";
const MEMBER_COLORS = [
  "hsl(267 84% 57%)",
  "hsl(162 63% 41%)",
  "hsl(200 70% 45%)",
  "hsl(340 65% 50%)",
  "hsl(38 92% 50%)",
  "hsl(12 80% 56%)",
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadTasks(): Task[] {
  const now = new Date();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data).map((task: Task, index: number) => ({
        ...task,
        projectId: task.projectId ?? getDefaultProjectId(index),
      }));

      if (localStorage.getItem(TASK_SEED_VERSION_KEY) !== TASK_SEED_VERSION) {
        const enriched = topUpSampleTasks(parsed, now);
        saveTasks(enriched);
        localStorage.setItem(TASK_SEED_VERSION_KEY, TASK_SEED_VERSION);
        return enriched;
      }

      return parsed;
    }
  } catch {}
  localStorage.setItem(TASK_SEED_VERSION_KEY, TASK_SEED_VERSION);
  return getDefaultTasks();
}

function loadTeamMembers(): Assignee[] {
  try {
    const data = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return DEFAULT_TEAM_MEMBERS;
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveTeamMembers(teamMembers: Assignee[]) {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(teamMembers));
}

function daysFromNow(now: Date, days: number) {
  return new Date(now.getTime() + 86400000 * days);
}

function isoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function createSeedTask(
  now: Date,
  config: Omit<Task, "id" | "createdAt" | "dueDate"> & { dueInDays: number; createdDaysAgo: number }
): Task {
  return {
    id: generateId(),
    title: config.title,
    description: config.description,
    status: config.status,
    priority: config.priority,
    dueDate: isoDate(daysFromNow(now, config.dueInDays)),
    createdAt: daysFromNow(now, -config.createdDaysAgo).toISOString(),
    projectId: config.projectId,
    assigneeId: config.assigneeId,
  };
}

function getSeedTaskTemplates(now: Date): Array<Omit<Task, "id" | "createdAt" | "dueDate"> & { dueInDays: number; createdDaysAgo: number }> {
  return [
    { title: "Design system architecture", description: "Create the foundational design tokens and component library", status: "completed", priority: "high", dueInDays: -1, createdDaysAgo: 5, projectId: "72ipo", assigneeId: "1" },
    { title: "Implement user authentication", description: "Set up login and signup flows with proper validation", status: "inprogress", priority: "high", dueInDays: 2, createdDaysAgo: 3, projectId: "monashee-insights", assigneeId: "2" },
    { title: "Build dashboard analytics", description: "Create summary cards and charts for task overview", status: "inprogress", priority: "medium", dueInDays: 4, createdDaysAgo: 2, projectId: "real-estate", assigneeId: "3" },
    { title: "Add drag and drop to Kanban", description: "Implement DnD functionality for the board view", status: "todo", priority: "medium", dueInDays: 7, createdDaysAgo: 1, projectId: "72ipo", assigneeId: "4" },
    { title: "Write API documentation", description: "Document all REST endpoints with examples", status: "todo", priority: "low", dueInDays: 10, createdDaysAgo: 0, projectId: "monashee-insights", assigneeId: "5" },
    { title: "Set up CI/CD pipeline", description: "Configure automated testing and deployment", status: "todo", priority: "high", dueInDays: -3, createdDaysAgo: 0, projectId: "real-estate", assigneeId: "1" },
    { title: "Create onboarding checklist", description: "Draft first-week checklist for new team members", status: "completed", priority: "low", dueInDays: -6, createdDaysAgo: 8, projectId: "72ipo", assigneeId: "4" },
    { title: "Refine mobile nav interactions", description: "Improve tap targets and transitions on smaller screens", status: "inprogress", priority: "medium", dueInDays: 5, createdDaysAgo: 2, projectId: "real-estate", assigneeId: "5" },
    { title: "Prepare sprint planning board", description: "Organize backlog items and sprint goals for kickoff", status: "todo", priority: "medium", dueInDays: 6, createdDaysAgo: 1, projectId: "monashee-insights", assigneeId: "3" },
    { title: "Audit accessibility contrast", description: "Review key screens for WCAG color contrast compliance", status: "todo", priority: "high", dueInDays: 9, createdDaysAgo: 0, projectId: "72ipo", assigneeId: "2" },
    { title: "Finalize release notes", description: "Compile delivered features and known issues for release", status: "inprogress", priority: "high", dueInDays: 3, createdDaysAgo: 1, projectId: "monashee-insights", assigneeId: "1" },
    { title: "Set up customer feedback form", description: "Create and connect a feedback intake form for beta users", status: "todo", priority: "low", dueInDays: 12, createdDaysAgo: 0, projectId: "real-estate", assigneeId: "4" },
    { title: "Launch IPO FAQ module", description: "Add a searchable FAQ section for retail investors on the landing page", status: "todo", priority: "medium", dueInDays: 8, createdDaysAgo: 1, projectId: "72ipo", assigneeId: "2" },
    { title: "Review analytics anomaly alerts", description: "Investigate alert thresholds that are over-reporting drops in the KPI dashboard", status: "inprogress", priority: "high", dueInDays: 4, createdDaysAgo: 2, projectId: "monashee-insights", assigneeId: "5" },
    { title: "Create listing image upload guide", description: "Document image size requirements and upload steps for listing managers", status: "completed", priority: "low", dueInDays: -2, createdDaysAgo: 4, projectId: "real-estate", assigneeId: "1" },
    { title: "Build approvals overview widget", description: "Add a dashboard widget showing pending approvals by team and urgency", status: "inprogress", priority: "high", dueInDays: 5, createdDaysAgo: 2, projectId: "pulse-hq", assigneeId: "1" },
    { title: "Map approval escalation rules", description: "Define escalation order and time thresholds for stalled requests", status: "todo", priority: "medium", dueInDays: 9, createdDaysAgo: 1, projectId: "pulse-hq", assigneeId: "5" },
    { title: "Polish request timeline visuals", description: "Improve spacing, hierarchy, and badge treatment in the approval timeline", status: "completed", priority: "low", dueInDays: -4, createdDaysAgo: 6, projectId: "pulse-hq", assigneeId: "4" },
    { title: "Create SLA alert badges", description: "Surface overdue and at-risk ticket states clearly in the queue list", status: "todo", priority: "high", dueInDays: 7, createdDaysAgo: 1, projectId: "lumen-support", assigneeId: "2" },
    { title: "Add macro usage analytics", description: "Track template usage and response performance for support team leads", status: "inprogress", priority: "medium", dueInDays: 10, createdDaysAgo: 3, projectId: "lumen-support", assigneeId: "5" },
    { title: "Refresh help article layout", description: "Improve content readability and related-article discovery in the knowledge base", status: "completed", priority: "medium", dueInDays: -1, createdDaysAgo: 5, projectId: "lumen-support", assigneeId: "4" },
    { title: "Triage ticket queue filters", description: "Fix priority and SLA filters so agents can narrow queue views correctly", status: "todo", priority: "medium", dueInDays: 6, createdDaysAgo: 1, projectId: "lumen-support", assigneeId: "3" },
    { title: "Restructure product comparison section", description: "Improve readability of plan comparison blocks and support stronger CTA placement", status: "inprogress", priority: "high", dueInDays: 8, createdDaysAgo: 2, projectId: "crm-website-design", assigneeId: "1" },
    { title: "Refresh demo request flow", description: "Simplify the form layout and reduce friction in the final submission step", status: "todo", priority: "medium", dueInDays: 11, createdDaysAgo: 1, projectId: "crm-website-design", assigneeId: "4" },
    { title: "Add payout exceptions panel", description: "Highlight failed or delayed payouts in a visible dashboard section", status: "todo", priority: "high", dueInDays: 9, createdDaysAgo: 1, projectId: "atlas-finops", assigneeId: "5" },
    { title: "Improve reconciliation export format", description: "Align exported columns with the finance team review template", status: "inprogress", priority: "medium", dueInDays: 12, createdDaysAgo: 3, projectId: "atlas-finops", assigneeId: "3" },
    { title: "Create interviewer load view", description: "Show scheduled interviews by interviewer to avoid overbooking", status: "inprogress", priority: "medium", dueInDays: 13, createdDaysAgo: 2, projectId: "northstar-hiring", assigneeId: "5" },
    { title: "Add feedback reminder triggers", description: "Send reminders when interview feedback is missing past SLA", status: "todo", priority: "high", dueInDays: 14, createdDaysAgo: 0, projectId: "northstar-hiring", assigneeId: "3" },
    { title: "Build assessment summary cards", description: "Show attempt count, score, and pending reviews in the admin view", status: "inprogress", priority: "high", dueInDays: 10, createdDaysAgo: 2, projectId: "greenleaf-academy", assigneeId: "1" },
    { title: "Improve module completion banners", description: "Add clearer next-step prompts after learners finish a module", status: "todo", priority: "medium", dueInDays: 15, createdDaysAgo: 1, projectId: "greenleaf-academy", assigneeId: "4" },
    { title: "Add delayed shipment queue", description: "Group delayed fulfillment items into a dedicated action view", status: "todo", priority: "high", dueInDays: 16, createdDaysAgo: 0, projectId: "supply-sync", assigneeId: "1" },
    { title: "Map stockout escalation flow", description: "Define notification and owner rules for stockout scenarios", status: "inprogress", priority: "medium", dueInDays: 17, createdDaysAgo: 2, projectId: "supply-sync", assigneeId: "5" },
    { title: "Create strategic milestones panel", description: "Show major initiative milestones with owner and status in one summary section", status: "inprogress", priority: "high", dueInDays: 18, createdDaysAgo: 2, projectId: "orbit-suite", assigneeId: "5" },
    { title: "Add leadership digest filters", description: "Allow updates to be filtered by team, priority, and time range", status: "todo", priority: "medium", dueInDays: 20, createdDaysAgo: 1, projectId: "orbit-suite", assigneeId: "2" },
    { title: "Build merchant onboarding checklist", description: "Create a guided setup checklist with document and KYC checkpoints", status: "todo", priority: "high", dueInDays: 19, createdDaysAgo: 1, projectId: "harbor-pay", assigneeId: "1" },
    { title: "Add settlement issue summary", description: "Highlight stuck settlements and unresolved issues in the operations overview", status: "inprogress", priority: "medium", dueInDays: 21, createdDaysAgo: 2, projectId: "harbor-pay", assigneeId: "3" },
  ];
}

function getDefaultTasks(): Task[] {
  const now = new Date();
  return getSeedTaskTemplates(now).map((task) => createSeedTask(now, task));
}

function topUpSampleTasks(existingTasks: Task[], now: Date): Task[] {
  const existingTitles = new Set(existingTasks.map((task) => task.title.toLowerCase()));
  const supplemental = getSeedTaskTemplates(now);

  const additions = supplemental
    .filter((task) => !existingTitles.has(task.title.toLowerCase()))
    .map((task) => createSeedTask(now, task));

  return [...existingTasks, ...additions];
}

function getDefaultProjectId(index: number) {
  const projectIds = [
    "72ipo",
    "monashee-insights",
    "real-estate",
    "pulse-hq",
    "lumen-support",
    "crm-website-design",
    "atlas-finops",
    "northstar-hiring",
    "greenleaf-academy",
    "supply-sync",
    "orbit-suite",
    "harbor-pay",
  ];
  return projectIds[index % projectIds.length];
}

export function getAssignee(id?: string, teamMembers: Assignee[] = DEFAULT_TEAM_MEMBERS): Assignee | undefined {
  return teamMembers.find((m) => m.id === id);
}

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [teamMembers, setTeamMembers] = useState<Assignee[]>(loadTeamMembers);

  const updateTasks = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      saveTasks(next);
      return next;
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, "id" | "createdAt">) => {
    updateTasks((prev) => [
      { ...task, id: generateId(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [updateTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [updateTasks]);

  const deleteTask = useCallback((id: string) => {
    updateTasks((prev) => prev.filter((t) => t.id !== id));
  }, [updateTasks]);

  const addTeamMember = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setTeamMembers((prev) => {
      const nextMember: Assignee = {
        id: generateId(),
        name: trimmedName,
        initials: buildInitials(trimmedName),
        color: MEMBER_COLORS[prev.length % MEMBER_COLORS.length],
      };
      const next = [...prev, nextMember];
      saveTeamMembers(next);
      return next;
    });
  }, []);

  return { tasks, teamMembers, addTask, updateTask, deleteTask, addTeamMember };
}
