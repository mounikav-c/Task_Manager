import { TopNav } from "@/components/TopNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { buildUserProfile } from "@/lib/userProfile";

export function SettingsPage() {
  const { user } = useAuthUser();
  const profile = buildUserProfile(user);

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Settings" />
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <div className="rounded-xl border border-border/60 bg-card p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-base font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-foreground text-lg font-bold">{profile.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{profile.displayName}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">First Name</Label>
                <Input value={profile.firstName} readOnly className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Last Name</Label>
                <Input value={profile.lastName} readOnly className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input value={profile.email} type="email" readOnly className="h-9 text-sm" />
            </div>
            <div className="flex justify-end">
              <Button disabled className="h-9 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-sm">Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
