import { CalendarDays, FolderKanban, HelpCircle, LayoutDashboard, ListTodo, LogOut, MessageCircle, Settings, Users, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthUser } from "@/contexts/AuthUserContext";
import type { DirectMessageMember } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Projects", url: "/board", icon: FolderKanban },
  { title: "Meetings", url: "/meetings", icon: CalendarDays },
  { title: "Members", url: "/members", icon: Users },
  { title: "Chatbot", url: "/chatbot", icon: MessageCircle },
];

const generalItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

interface AppSidebarProps {
  onAddProject: () => void;
  onAddMember: () => void;
  onLogout: () => void;
  directMessageMembers: DirectMessageMember[];
}

export function AppSidebar({ onAddProject, onAddMember, onLogout, directMessageMembers }: AppSidebarProps) {
  const { state } = useSidebar();
  const { user, departments, selectedDepartmentId, canEditSelectedDepartment, onSelectDepartment } = useAuthUser();
  const collapsed = state === "collapsed";
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);

  return (
    <Sidebar collapsible="icon" variant="floating" className="p-3">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4338ca_0%,#5b21b6_100%)] text-primary-foreground shadow-[0_20px_36px_-20px_rgba(79,70,229,0.42)]">
            <FolderKanban className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/40 font-medium">Workspace</p>
              <p className="bg-[linear-gradient(135deg,#312e81_0%,#4338ca_50%,#5b21b6_100%)] bg-clip-text text-lg leading-tight font-extrabold tracking-tight text-transparent">TaskFlow</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-workspace-card mt-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground"
              style={{ background: `linear-gradient(135deg, ${selectedDepartment?.color ?? "#34d399"} 0%, rgba(15,23,42,0.85) 100%)` }}
            >
              {selectedDepartment?.name?.[0] ?? "D"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selectedDepartment?.name ?? "Department"}</p>
              <p className="text-[11px] text-muted-foreground">
                {canEditSelectedDepartment ? "Default department" : "View-only department"}
              </p>
            </div>
          </div>
        )}

        {!collapsed && departments.length > 0 && (
          <div className="mt-3">
            <Select value={selectedDepartmentId ? String(selectedDepartmentId) : undefined} onValueChange={(value) => onSelectDepartment(Number(value))}>
              <SelectTrigger className="h-10 rounded-xl border-white/60 bg-white/70 text-sm">
                <SelectValue placeholder="Choose department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3">
        <SidebarGroup className="px-0">
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">Main Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="sidebar-nav-link flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150"
                      activeClassName="text-indigo-700 border border-indigo-300/30 font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-3 bg-sidebar-border/50" />

        <SidebarGroup className="px-0">
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">Direct Messages</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/messages"
                    className="sidebar-nav-link flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150"
                    activeClassName="text-indigo-700 border border-indigo-300/30 font-semibold"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Direct Messages</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {!collapsed &&
                directMessageMembers.map((member) => (
                  <SidebarMenuItem key={member.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/messages/${member.id}`}
                        className={`sidebar-nav-link flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          member.unread_count > 0
                            ? "border-emerald-300/60 bg-emerald-50/80 shadow-[0_16px_30px_-24px_rgba(16,185,129,0.5)]"
                            : "border-transparent"
                        }`}
                        activeClassName="text-indigo-700 border border-indigo-300/30 font-semibold"
                      >
                        <Avatar className="h-7 w-7 ring-1 ring-white/60">
                          <AvatarFallback className="text-[10px] font-semibold text-white" style={{ backgroundColor: member.color }}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {member.name}
                              {member.id === user?.id ? " (You)" : ""}
                            </span>
                            {member.unread_count > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-white">
                                {member.unread_count > 9 ? "9+" : member.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-3 bg-sidebar-border/50" />

        <SidebarGroup className="px-0">
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">General</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="sidebar-nav-link flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150"
                      activeClassName="text-indigo-700 border border-indigo-300/30 font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="px-3 pb-4 pt-2">
          <div className="rounded-xl border border-white/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.74),rgba(245,243,255,0.52))] p-2.5 space-y-1.5 shadow-[0_26px_50px_-42px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
            <Button onClick={onAddProject} disabled={!canEditSelectedDepartment} className="h-10 w-full justify-start rounded-lg bg-[linear-gradient(135deg,#4338ca_0%,#5b21b6_100%)] text-primary-foreground hover:brightness-105 shadow-[0_18px_34px_-18px_rgba(79,70,229,0.36)] gap-2 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New Project
            </Button>
            <Button onClick={onAddMember} disabled={!canEditSelectedDepartment} variant="ghost" className="h-9 w-full justify-start rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 text-sm gap-2">
              <Users className="h-3.5 w-3.5" />
              Add Member
            </Button>
          </div>
          <Button onClick={onLogout} variant="ghost" className="h-9 justify-start rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-sm gap-2 mt-1">
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
