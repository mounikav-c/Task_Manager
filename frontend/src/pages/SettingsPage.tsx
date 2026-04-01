import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { TopNav } from "@/components/TopNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, type UserProfile } from "@/lib/api";

function buildInitials(firstName: string, lastName: string, email: string) {
  const fallback = email.trim().charAt(0).toUpperCase() || "U";
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.trim().toUpperCase();
  return initials || fallback;
}

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getUserProfile();
        setProfile(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
      } catch (error) {
        console.error("Failed to load user profile", error);
        toast.error("Could not load profile details");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const displayName = useMemo(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || profile?.email || "User";
  }, [firstName, lastName, profile?.email]);

  const initials = useMemo(
    () => buildInitials(firstName, lastName, profile?.email ?? ""),
    [firstName, lastName, profile?.email],
  );

  const hasChanges = profile !== null && (firstName !== profile.first_name || lastName !== profile.last_name);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setProfile(updated);
      setFirstName(updated.first_name);
      setLastName(updated.last_name);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Failed to save profile", error);
      toast.error("Could not save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Settings" />
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <div className="rounded-xl border border-border/60 bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="mb-4 text-base font-semibold">Profile</h2>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-bold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">{profile?.email ?? ""}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  disabled={isLoading}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  disabled={isLoading}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input value={profile?.email ?? ""} type="email" readOnly disabled className="h-9 text-sm" />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isLoading || isSaving || !hasChanges}
                className="h-9 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
