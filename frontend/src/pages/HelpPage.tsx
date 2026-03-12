import { LifeBuoy, Mail, MessageCircleQuestion } from "lucide-react";
import { TopNav } from "@/components/TopNav";

export function HelpPage() {
  return (
    <div className="flex h-full flex-col">
      <TopNav title="Help" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="dashboard-panel max-w-3xl">
          <div className="mb-5">
            <p className="text-xs font-medium text-muted-foreground">Support center</p>
            <h2 className="text-lg font-semibold tracking-tight">How can we help?</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <LifeBuoy className="h-4 w-4 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Guides</p>
              <p className="mt-1 text-xs text-muted-foreground">Learn the core workflow and features quickly.</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <MessageCircleQuestion className="h-4 w-4 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">FAQ</p>
              <p className="mt-1 text-xs text-muted-foreground">Find answers to common setup and usage questions.</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <Mail className="h-4 w-4 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Contact</p>
              <p className="mt-1 text-xs text-muted-foreground">Reach support at support@taskflow.app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
