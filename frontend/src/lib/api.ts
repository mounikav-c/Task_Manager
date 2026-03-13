const API_BASE_URL = "http://127.0.0.1:8000/api";

export interface TeamMember {
  id: number;
  name: string;
  initials: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
  objective: string;
  summary: string;
  users: string;
  expected_output: string;
  start_date: string | null;
  deadline: string | null;
  status: "Planning" | "Active" | "At Risk" | "Completed";
  progress: number;
  owner: number | null;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  project: number | null;
  project_name?: string;
  assignee: number | null;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  agenda: string;
  scheduled_for: string;
  duration_minutes: number;
  location: string;
  meeting_link: string;
  status: "scheduled" | "completed" | "cancelled";
  project: number | null;
  project_name?: string;
  organizer: number | null;
  organizer_name?: string;
  attendees: number[];
  attendee_details?: TeamMember[];
  created_at: string;
  updated_at: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  getMembers: () => request<TeamMember[]>("/members/"),
  getProjects: () => request<Project[]>("/projects/"),
  getTasks: () => request<Task[]>("/tasks/"),
  getMeetings: () => request<Meeting[]>("/meetings/"),

  createMember: (data: { name: string; initials: string; color: string }) =>
    request<TeamMember>("/members/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createTask: (data: {
    title: string;
    description: string;
    status: "todo" | "inprogress" | "completed";
    priority: "low" | "medium" | "high";
    due_date: string | null;
    project: number | null;
    assignee: number | null;
  }) =>
    request<Task>("/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createProject: (data: {
    name: string;
    description: string;
    summary: string;
    start_date: string | null;
    deadline: string | null;
    status: "Planning" | "Active" | "At Risk" | "Completed";
    progress: number;
    owner: number | null;
  }) =>
    request<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createMeeting: (data: {
    title: string;
    agenda: string;
    scheduled_for: string;
    duration_minutes: number;
    location: string;
    meeting_link: string;
    status: "scheduled" | "completed" | "cancelled";
    project: number | null;
    organizer: number | null;
    attendees: number[];
  }) =>
    request<Meeting>("/meetings/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProject: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      summary: string;
      start_date: string | null;
      deadline: string | null;
      status: "Planning" | "Active" | "At Risk" | "Completed";
      progress: number;
      owner: number | null;
    }>,
  ) =>
    request<Project>(`/projects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateTask: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      status: "todo" | "inprogress" | "completed";
      priority: "low" | "medium" | "high";
      due_date: string | null;
      project: number | null;
      assignee: number | null;
    }>,
  ) =>
    request<Task>(`/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateMeeting: (
    id: number,
    data: Partial<{
      title: string;
      agenda: string;
      scheduled_for: string;
      duration_minutes: number;
      location: string;
      meeting_link: string;
      status: "scheduled" | "completed" | "cancelled";
      project: number | null;
      organizer: number | null;
      attendees: number[];
    }>,
  ) =>
    request<Meeting>(`/meetings/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteTask: (id: number) =>
    request<void>(`/tasks/${id}/`, {
      method: "DELETE",
    }),
};
