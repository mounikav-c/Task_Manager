import { FolderKanban, HelpCircle, LayoutDashboard, ListTodo, LogOut, Settings, Users, Sparkles } from "lucide-react";
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
    <Sidebar collapsible="icon" variant="floating" className="p-3">
      <SidebarHeader className="px-3 pt-4 pb-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
            <FolderKanban className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/40 font-medium">Workspace</p>
              <p className="text-lg leading-tight font-semibold tracking-tight text-sidebar-accent-foreground">TaskFlow</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="sidebar-workspace-card mt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-primary-foreground">G</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">GoldenHills India</p>
              <p className="text-[11px] text-muted-foreground">Company workspace</p>
            </div>
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
                      className="sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                      activeClassName="bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]"
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
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">General</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {generalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="sidebar-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                      activeClassName="bg-primary/15 text-primary border border-primary/20"
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
          <div className="rounded-xl border border-border/50 bg-card/80 p-2.5 space-y-1.5 backdrop-blur-sm">
            <Button onClick={onAddProject} className="h-10 w-full justify-start rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 gap-2 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New Project
            </Button>
            <Button onClick={onAddMember} variant="ghost" className="h-9 w-full justify-start rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 text-sm gap-2">
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
