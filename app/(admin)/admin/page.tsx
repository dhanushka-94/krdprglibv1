import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminPath } from "@/lib/config";
import {
  FolderTree,
  FolderOpen,
  Music,
  PlusCircle,
  Users,
  Activity,
  FileUp,
  ChevronRight,
} from "lucide-react";
import { getSession } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";
import { formatDateSriLanka, formatDateOnlyDisplay } from "@/lib/date-utils";

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

const dashboardCardClass =
  "transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5";

async function getDashboardStats(isAdmin: boolean) {
  const [progRes, catRes, subRes, userRes, activityRes] = await Promise.all([
    supabase.from("audio_programmes").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("subcategories").select("*", { count: "exact", head: true }),
    isAdmin ? supabase.from("users").select("*", { count: "exact", head: true }) : Promise.resolve({ count: 0 }),
    isAdmin
      ? supabase.from("activity_logs").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    programmes: progRes.count ?? 0,
    categories: catRes.count ?? 0,
    subcategories: subRes.count ?? 0,
    users: userRes.count ?? 0,
    activities: activityRes.count ?? 0,
  };
}

async function getRecentProgrammes() {
  const { data } = await supabase
    .from("audio_programmes")
    .select("id, title, slug, broadcasted_date, category:categories(name)")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

async function getRecentActivity() {
  const { data } = await supabase
    .from("activity_logs")
    .select("id, user_email, action, entity_title, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

function RecentActivityCard({
  recentActivity,
  actionLabels,
}: {
  recentActivity: { id: string; user_email: string | null; action: string; entity_title: string | null; created_at: string }[];
  actionLabels: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={getAdminPath("activity-logs")} className="flex items-center gap-1">
            View all <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentActivity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-2 rounded-lg p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{log.user_email ?? "—"}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {actionLabels[log.action] ?? log.action}
                    {log.entity_title ? " \"" + log.entity_title + "\"" : ""}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateSriLanka(log.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const session = await getSession();
  const isAdmin = session?.roleName === "Admin";

  const [stats, recentProgrammes, recentActivity] = await Promise.all([
    getDashboardStats(isAdmin),
    getRecentProgrammes(),
    isAdmin ? getRecentActivity() : Promise.resolve([]),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Television and Farm Broadcasting Service – All Radio Programmes Library
        </p>
        {session?.email && (
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{session.email}</span>
          </p>
        )}
      </div>

      {/* Stats overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Music className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.programmes}</p>
                <p className="text-sm text-muted-foreground">Total Programmes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <FolderTree className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.users}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Activity className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activities}</p>
                  <p className="text-sm text-muted-foreground">Activity Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {isAdmin && (
          <Link href={getAdminPath("categories")}>
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <FolderTree className="size-5 text-primary" />
                    Categories
                  </span>
                  <span className="text-2xl font-bold text-primary">{stats.categories}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Manage main categories.
                </p>
                <Button size="sm" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <Link href={getAdminPath("subcategories")}>
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <FolderOpen className="size-5 text-primary" />
                    Subcategories
                  </span>
                  <span className="text-2xl font-bold text-primary">{stats.subcategories}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Manage subcategories.
                </p>
                <Button size="sm" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href={getAdminPath("programmes")}>
          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Music className="size-5 text-primary" />
                  Programmes
                </span>
                <span className="text-2xl font-bold text-primary">{stats.programmes}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                View and edit programmes.
              </p>
              <Button size="sm" className="w-full">
                View
              </Button>
            </CardContent>
          </Card>
        </Link>

        {isAdmin && (
          <Link href={getAdminPath("users")}>
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Users
                  </span>
                  <span className="text-2xl font-bold text-primary">{stats.users}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Manage users and roles.
                </p>
                <Button size="sm" className="w-full">
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href={getAdminPath("programmes/upload")}>
          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PlusCircle className="size-5 text-primary" />
                Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Upload new MP3 programmes.
              </p>
              <Button size="sm" className="w-full">
                <FileUp className="mr-2 size-4" />
                Upload
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Programmes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={getAdminPath("programmes")} className="gap-1">
                View all <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProgrammes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No programmes yet. Upload your first programme.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentProgrammes.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={getAdminPath(`programmes/${p.id}/edit`)}
                      className="flex items-center justify-between rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">{p.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateOnlyDisplay(p.broadcasted_date)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {isAdmin ? (
          <RecentActivityCard
            recentActivity={recentActivity}
            actionLabels={ACTION_LABELS}
          />
        ) : null}
      </div>
    </div>
  );
}
