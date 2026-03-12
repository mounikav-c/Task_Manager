import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Command } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface TopNavProps {
  title: string;
}

export function TopNav({ title }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border/70 bg-white px-5 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-lg border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground h-8 w-8" />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="hidden max-w-sm flex-1 items-center justify-end md:flex">
        <div className="relative w-full max-w-xs lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-lg border-border/50 bg-accent/50 pl-9 pr-16 shadow-none text-sm placeholder:text-muted-foreground/60 focus:bg-accent focus:border-primary/30"
            placeholder="Search anything..."
          />
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-border/50 bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
            <Command className="h-2.5 w-2.5" />
            K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg border border-border/50 bg-accent/50 p-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent hover:border-primary/20">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
        </button>
        <Avatar className="h-8 w-8 ring-1 ring-border/50">
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-foreground text-[11px] font-semibold">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
