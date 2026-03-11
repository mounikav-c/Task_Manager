import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Command } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface TopNavProps {
  title: string;
}

export function TopNav({ title }: TopNavProps) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-card/70 px-5 shrink-0 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-xl border border-border/70 text-muted-foreground hover:bg-background hover:text-foreground" />
        <h1 className="text-[1.75rem] font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="hidden max-w-sm flex-1 items-center justify-end md:flex">
        <div className="relative w-full max-w-xs lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9 pr-20 shadow-none" placeholder="Search anything" />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-border/70 bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />
            K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-xl border border-border/70 bg-background/80 p-2.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-background">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </button>
        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-rose-200 text-slate-700 text-xs font-semibold">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
