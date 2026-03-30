import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { buildUserProfile } from "@/lib/userProfile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TopNavProps {
  title: string;
}

export function TopNav({ title }: TopNavProps) {
  const { user, departments, selectedDepartmentId, canEditSelectedDepartment, onLogout } = useAuthUser();
  const profile = buildUserProfile(user);
  const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border/70 bg-white px-5 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-lg border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground h-8 w-8" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {selectedDepartment && (
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${canEditSelectedDepartment ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            {selectedDepartment.name} {canEditSelectedDepartment ? "" : "Read Only"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg border border-border/50 bg-accent/50 p-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent hover:border-primary/20">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <Avatar className="h-8 w-8 ring-1 ring-border/50">
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-foreground text-[11px] font-semibold">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
