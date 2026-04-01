const API_HOST =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "127.0.0.1";

const API_BASE_URL = `http://${API_HOST}:8000/api`;

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export interface TeamMember {
  id: number;
  name: string;
  initials: string;
  color: string;
  department?: number | null;
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
  department?: number | null;
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
  department?: number | null;
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
  department?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: {
    id: number;
    username: string;
    home_department_id: number | null;
  } | null;
  departments: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }

  const values = Object.values(payload as Record<string, unknown>).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }

    return typeof value === "string" ? [value] : [];
  });

  return values[0] ?? fallback;
}

function withDepartment(endpoint: string, departmentId?: number | null) {
  if (!departmentId) {
    return `${API_BASE_URL}${endpoint}`;
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  return `${API_BASE_URL}${endpoint}${separator}department=${departmentId}`;
}

async function request<T>(endpoint: string, options?: RequestInit, departmentId?: number | null): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const csrfToken = getCookie("taskmanager_csrftoken");

  const response = await fetch(withDepartment(endpoint, departmentId), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(method !== "GET" && method !== "HEAD" && csrfToken
        ? { "X-CSRFToken": csrfToken }
        : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(getErrorMessage(payload, `API request failed: ${response.status}`));
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  getAuthSession: () => request<AuthSession>("/auth/session/"),
  getUserProfile: () => request<UserProfile>("/auth/profile/"),
  loginDemo: () =>
    request<AuthSession>("/auth/demo-login/", {
      method: "POST",
    }),
    googleLogin: (idToken: string) =>
  request<AuthSession>("/auth/google/", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  }),
  googleTokenLogin: (accessToken: string) =>
    request<AuthSession>("/auth/google/token/", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    }),

  logout: () =>
    request<{ authenticated: boolean }>("/auth/logout/", {
      method: "POST",
    }),
  updateUserProfile: (data: { first_name: string; last_name: string }) =>
    request<UserProfile>("/auth/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  createContactMessage: (data: ContactMessagePayload) =>
    request<{ detail: string; message: { id: number; name: string; email: string; message: string; created_at: string } }>(
      "/contact/",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),
  getMembers: (departmentId?: number | null) => request<TeamMember[]>("/members/", undefined, departmentId),
  getProjects: (departmentId?: number | null) => request<Project[]>("/projects/", undefined, departmentId),
  getTasks: (departmentId?: number | null) => request<Task[]>("/tasks/", undefined, departmentId),
  getAvailableTasks: (departmentId?: number | null) => request<Task[]>("/tasks/available/", undefined, departmentId),
  getMeetings: (departmentId?: number | null) => request<Meeting[]>("/meetings/", undefined, departmentId),

  createMember: (data: { name: string; initials: string; color: string }, departmentId?: number | null) =>
    request<TeamMember>("/members/", {
      method: "POST",
      body: JSON.stringify(data),
    }, departmentId),

  createTask: (data: {
    title: string;
    description: string;
    status: "todo" | "inprogress" | "completed";
    priority: "low" | "medium" | "high";
    due_date: string | null;
    project: number | null;
    assignee: number | null;
  }, departmentId?: number | null) =>
    request<Task>("/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    }, departmentId),

  createProject: (data: {
    name: string;
    description: string;
    summary: string;
    start_date: string | null;
    deadline: string | null;
    status: "Planning" | "Active" | "At Risk" | "Completed";
    progress: number;
    owner: number | null;
  }, departmentId?: number | null) =>
    request<Project>("/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    }, departmentId),

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
  }, departmentId?: number | null) =>
    request<Meeting>("/meetings/", {
      method: "POST",
      body: JSON.stringify(data),
    }, departmentId),

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
    departmentId?: number | null,
  ) =>
    request<Project>(`/projects/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, departmentId),

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
    departmentId?: number | null,
  ) =>
    request<Task>(`/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, departmentId),

  claimTask: (id: number, departmentId?: number | null) =>
    request<Task>(`/tasks/${id}/claim/`, {
      method: "POST",
    }, departmentId),

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
    departmentId?: number | null,
  ) =>
    request<Meeting>(`/meetings/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, departmentId),

  deleteTask: (id: number, departmentId?: number | null) =>
    request<void>(`/tasks/${id}/`, {
      method: "DELETE",
    }, departmentId),
};
