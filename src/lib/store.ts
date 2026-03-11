import { useState, useCallback } from "react";

export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "inprogress" | "completed";

export interface Assignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export const TEAM_MEMBERS: Assignee[] = [
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
  assigneeId?: string;
}

const STORAGE_KEY = "taskflow-tasks";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return getDefaultTasks();
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getDefaultTasks(): Task[] {
  const now = new Date();
  return [
    { id: generateId(), title: "Design system architecture", description: "Create the foundational design tokens and component library", status: "completed", priority: "high", dueDate: new Date(now.getTime() - 86400000).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(), assigneeId: "1" },
    { id: generateId(), title: "Implement user authentication", description: "Set up login and signup flows with proper validation", status: "inprogress", priority: "high", dueDate: new Date(now.getTime() + 86400000 * 2).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(), assigneeId: "2" },
    { id: generateId(), title: "Build dashboard analytics", description: "Create summary cards and charts for task overview", status: "inprogress", priority: "medium", dueDate: new Date(now.getTime() + 86400000 * 4).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(), assigneeId: "3" },
    { id: generateId(), title: "Add drag and drop to Kanban", description: "Implement DnD functionality for the board view", status: "todo", priority: "medium", dueDate: new Date(now.getTime() + 86400000 * 7).toISOString().split("T")[0], createdAt: new Date(now.getTime() - 86400000).toISOString(), assigneeId: "4" },
    { id: generateId(), title: "Write API documentation", description: "Document all REST endpoints with examples", status: "todo", priority: "low", dueDate: new Date(now.getTime() + 86400000 * 10).toISOString().split("T")[0], createdAt: now.toISOString(), assigneeId: "5" },
    { id: generateId(), title: "Set up CI/CD pipeline", description: "Configure automated testing and deployment", status: "todo", priority: "high", dueDate: new Date(now.getTime() - 86400000 * 3).toISOString().split("T")[0], createdAt: now.toISOString(), assigneeId: "1" },
  ];
}

export function getAssignee(id?: string): Assignee | undefined {
  return TEAM_MEMBERS.find((m) => m.id === id);
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

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

  return { tasks, addTask, updateTask, deleteTask };
}
