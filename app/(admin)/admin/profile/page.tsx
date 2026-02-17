"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Music, Activity, Pencil, ChevronRight, Lock, FolderTree } from "lucide-react";
import { getAdminPath } from "@/lib/config";
import { formatDateSriLanka } from "@/lib/date-utils";

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  programme_upload: "Upload",
  programme_create: "Create programme",
  programme_update: "Update programme",
  programme_delete: "Delete programme",
  programme_import: "Import",
  category_create: "Create category",
  category_update: "Update category",
  category_delete: "Delete category",
  subcategory_create: "Create subcategory",
  subcategory_update: "Update subcategory",
  subcategory_delete: "Delete subcategory",
  user_create: "Create user",
  user_update: "Update user",
  user_delete: "Delete user",
  settings_update: "Update settings",
};

interface ProfileData {
  profile: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
    role: string;
    created_at: string;
  };
  programmes_uploaded_count: number;
  category_wise_counts?: Array<{ category_id: string; category_name: string; count: number }>;
  recent_activity: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    entity_title: string | null;
    created_at: string;
  }>;
}

interface ProgrammeRow {
  id: string;
  title: string;
  slug: string;
  broadcasted_date: string;
  category?: { name: string };
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [myProgrammes, setMyProgrammes] = useState<ProgrammeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/programmes?scope=admin&created_by=me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([meData, programmes]) => {
        if (meData.profile) {
          setData(meData);
          setName(meData.profile.name ?? "");
          setPhone(meData.profile.phone ?? "");
          setBio(meData.profile.bio ?? "");
          setAvatarUrl(meData.profile.avatar_url ?? "");
        }
        if (Array.isArray(programmes)) setMyProgrammes(programmes);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    if (!data?.profile?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${data.profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim() || null, phone: phone.trim() || null, bio: bio.trim() || null, avatar_url: avatarUrl.trim() || null }),
      });
      const updated = await res.json();
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  name: name.trim() || null,
                  phone: phone.trim() || null,
                  bio: bio.trim() || null,
                  avatar_url: avatarUrl.trim() || null,
                },
              }
            : null
        );
        setEditing(false);
        toast.success("Profile updated");
      } else {
        toast.error(updated.error || "Failed to update");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        setChangingPassword(false);
        return;
      }
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  const { profile, programmes_uploaded_count, category_wise_counts, recent_activity } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold">
        <User className="size-8" />
        My profile
      </h1>

      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 size-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {(editing ? avatarUrl : profile.avatar_url) && (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editing ? avatarUrl : profile.avatar_url || ""}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
            )}
            {editing ? (
              <>
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                </div>
                <div className="grid gap-2">
                  <Label>Avatar URL</Label>
                  <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={3} />
                </div>
              </>
            ) : (
              <dl className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name</span>
                  <p className="font-medium">{profile.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-medium">{profile.role || "—"}</p>
                </div>
                {profile.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <span className="text-muted-foreground">Bio</span>
                    <p className="font-medium whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Change password
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your password. You will need your current password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {changingPassword ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {category_wise_counts && category_wise_counts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="size-5" />
                Programmes by category
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Programme counts for your accessible categories
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category_wise_counts.map((c) => (
                  <li key={c.category_id}>
                    <Link
                      href={`${getAdminPath("programmes")}?category_id=${c.category_id}`}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="font-medium">{c.category_name}</span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                          {c.count} programme{c.count !== 1 ? "s" : ""}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="size-5" />
              My uploads
            </CardTitle>
            <span className="text-2xl font-bold text-primary">{programmes_uploaded_count}</span>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Programmes you have uploaded. You can edit them from Manage Programmes.
            </p>
            {myProgrammes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center text-sm text-muted-foreground">
                No programmes uploaded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {myProgrammes.slice(0, 20).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={getAdminPath(`programmes/${p.id}/edit`)}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {p.broadcasted_date}
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {myProgrammes.length > 20 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing latest 20. View all in{" "}
                <Link href={getAdminPath("programmes")} className="text-primary hover:underline">
                  Manage Programmes
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Recent activity
            </CardTitle>
            <p className="text-sm text-muted-foreground">Your recent actions on the system.</p>
          </CardHeader>
          <CardContent>
            {recent_activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent_activity.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {ACTION_LABELS[log.action] ?? log.action}
                      {log.entity_title && (
                        <span className="ml-1 text-foreground">"{log.entity_title}"</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateSriLanka(log.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
