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
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data).map((task: Task, index: number) => ({
        ...task,
        projectId: task.projectId ?? getDefaultProjectId(index),
      }));
    }
  } catch {}
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

function getDefaultTasks(): Task[] {
  const now = new Date();
  return [
    { id: generateId(), title: "Design system architecture", description: "Create the foundational design tokens and component library", status: "completed", priority: "high", dueDate: new Date(now.getTime() - 86400000).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(), projectId: "72ipo", assigneeId: "1" },
    { id: generateId(), title: "Implement user authentication", description: "Set up login and signup flows with proper validation", status: "inprogress", priority: "high", dueDate: new Date(now.getTime() + 86400000 * 2).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(), projectId: "monashee-insights", assigneeId: "2" },
    { id: generateId(), title: "Build dashboard analytics", description: "Create summary cards and charts for task overview", status: "inprogress", priority: "medium", dueDate: new Date(now.getTime() + 86400000 * 4).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(), projectId: "real-estate", assigneeId: "3" },
    { id: generateId(), title: "Add drag and drop to Kanban", description: "Implement DnD functionality for the board view", status: "todo", priority: "medium", dueDate: new Date(now.getTime() + 86400000 * 7).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000).toISOString(), projectId: "72ipo", assigneeId: "4" },
    { id: generateId(), title: "Write API documentation", description: "Document all REST endpoints with examples", status: "todo", priority: "low", dueDate: new Date(now.getTime() + 86400000 * 10).toISOString().split("T")[0], createdAt: now.toISOString(), projectId: "monashee-insights", assigneeId: "5" },
    { id: generateId(), title: "Set up CI/CD pipeline", description: "Configure automated testing and deployment", status: "todo", priority: "high", dueDate: new Date(now.getTime() - 86400000 * 3).toISOString().split("T")[0], createdAt: now.toISOString(), projectId: "real-estate", assigneeId: "1" },
  ];
}

function getDefaultProjectId(index: number) {
  const projectIds = ["72ipo", "monashee-insights", "real-estate"];
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
