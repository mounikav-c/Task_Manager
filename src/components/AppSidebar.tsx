import { FolderKanban, HelpCircle, LayoutDashboard, ListTodo, LogOut, Settings, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
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
  { title: "Members", url: "/members", icon: Users },
];

const generalItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/settings", icon: HelpCircle },
];

interface AppSidebarProps {
  onAddProject: () => void;
  onAddMember: () => void;
  onLogout: () => void;
}

export function AppSidebar({ onAddProject, onAddMember, onLogout }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="floating" className="p-5">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c3aed] text-white shadow-[0_10px_24px_-18px_rgba(124,58,237,0.7)]">
            <FolderKanban className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-sidebar-foreground/55">Workspace</p>
              <p className="text-[1.75rem] leading-none font-semibold tracking-tight text-sidebar-accent-foreground">GoldenHills India</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-workspace-card mt-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-lime-700">G</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">GoldenHills India</p>
              <p className="text-xs text-muted-foreground">Company workspace</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3">
        <SidebarGroup className="px-0">
          {!collapsed && <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Main Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="sidebar-nav-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors"
                      activeClassName="bg-sidebar-accent text-primary shadow-[0_10px_24px_-22px_rgba(139,92,246,0.55)]"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-3 bg-sidebar-border/70" />

        <SidebarGroup className="px-0">
          {!collapsed && <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/45">General</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="sidebar-nav-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors"
                      activeClassName="bg-sidebar-accent text-primary shadow-[0_10px_24px_-22px_rgba(139,92,246,0.55)]"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
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
          <div className="rounded-[1.35rem] border border-sidebar-border/70 bg-card p-3 shadow-[0_12px_28px_-24px_rgba(0,0,0,0.3)]">
            <Button onClick={onAddProject} className="h-11 w-full justify-start rounded-xl bg-[#6d28d9] hover:bg-[#5b21b6] shadow-[0_14px_24px_-18px_rgba(109,40,217,0.55)]">
              + Add Project
            </Button>
            <Button onClick={onAddMember} variant="ghost" className="mt-2 h-10 w-full justify-start rounded-xl text-sidebar-foreground/65 hover:bg-sidebar-accent/70">
              + Add Member
            </Button>
          </div>
          <Button onClick={onLogout} variant="ghost" className="h-11 justify-start rounded-2xl border border-red-200/70 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600">
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
