import type { AuthSession } from "@/lib/api";

type AuthUser = AuthSession["user"];

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizedUsername(username: string) {
  return username.replace(/[._-]+/g, " ").trim();
}

export function buildUserProfile(user: AuthUser) {
  if (!user) {
    return {
      displayName: "Guest User",
      firstName: "",
      lastName: "",
      email: "",
      initials: "GU",
    };
  }

  const raw = normalizedUsername(user.username);
  const parts = toTitleCase(raw).split(" ").filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  const displayName = parts.length > 0 ? parts.join(" ") : user.username;
  const initials = (firstName.charAt(0) + (lastName.charAt(0) || displayName.charAt(1) || "")).toUpperCase();

  return {
    displayName,
    firstName,
    lastName,
    email: user.username,
    initials: initials || "U",
  };
}
