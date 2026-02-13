"use client";

import { useState, useEffect } from "react";
import { AdminOnlyGuard } from "@/components/admin-only-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileBarChart2, FileDown, Activity, Music, Users } from "lucide-react";
import { formatDateOnlyDisplay } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import type { Category, Subcategory, RadioChannel } from "@/lib/types";

interface ActivityLog {
  id: string;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_title: string | null;
  created_at: string;
}

interface ProgrammeRow {
  id: string;
  title: string;
  slug: string;
  broadcasted_date: string;
  category?: Category | null;
  subcategory?: Subcategory | null;
  radio_channel?: RadioChannel | null;
}

interface UserOption {
  id: string;
  email: string;
}

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  programme_upload: "Upload programme",
  programme_create: "Create programme",
  programme_update: "Update programme",
  programme_delete: "Delete programme",
  programme_import: "Import programme",
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

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function ReportsPage() {
  return (
    <AdminOnlyGuard>
      <ReportsContent />
    </AdminOnlyGuard>
  );
}

function ReportsContent() {
  const [activeTab, setActiveTab] = useState<"activity" | "programme" | "users">("activity");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold">
          <FileBarChart2 className="size-8 text-primary" />
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and export activity, programme, and user reports
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeTab === "activity" ? "default" : "outline"}
          onClick={() => setActiveTab("activity")}
          className="gap-2"
        >
          <Activity className="size-4" />
          Activity Report
        </Button>
        <Button
          variant={activeTab === "programme" ? "default" : "outline"}
          onClick={() => setActiveTab("programme")}
          className="gap-2"
        >
          <Music className="size-4" />
          Programme Report
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
          className="gap-2"
        >
          <Users className="size-4" />
          Users Report
        </Button>
      </div>

      {activeTab === "activity" && <ActivityReport />}
      {activeTab === "programme" && <ProgrammeReport />}
      {activeTab === "users" && <UsersReport />}
    </div>
  );
}

function ActivityReport() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ report: "true", report_limit: "2000" });
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (userFilter !== "all") params.set("user_id", userFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      const res = await fetch(`/api/activity-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setLogs(data);
      else setLogs([]);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Date & Time", "User", "Role", "Action", "Entity"];
    const rows = logs.map((l) => [
      formatDate(l.created_at),
      l.user_email ?? "",
      l.user_role ?? "",
      formatAction(l.action),
      l.entity_title ?? l.entity_type ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-report-${dateFrom || "all"}-${dateTo || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Report</CardTitle>
        <p className="text-sm text-muted-foreground">
          User actions audit trail. Set filters and click Generate to refresh.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Date from</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Date to</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">User</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Action</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.entries(ACTION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={logs.length === 0}>
              <FileDown className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data. Set filters and click Generate.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date & time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>{log.user_email ?? "—"}</TableCell>
                    <TableCell>{log.user_role ?? "—"}</TableCell>
                    <TableCell>{formatAction(log.action)}</TableCell>
                    <TableCell>{log.entity_title ?? log.entity_type ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && logs.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {logs.length} record(s). Max 2,000 for export.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface UserReportRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  programmes_uploaded: number;
  activity_count: number;
}

function UsersReport() {
  const [rows, setRows] = useState<UserReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/users", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setRows(Array.isArray(data) ? data : []);
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Email", "Name", "Role", "Active", "Programmes Uploaded", "Activity Count", "Created"];
    const rowsCsv = rows.map((r) => [
      r.email,
      r.name ?? "",
      r.role,
      r.is_active ? "Yes" : "No",
      String(r.programmes_uploaded),
      String(r.activity_count),
      formatDate(r.created_at),
    ]);
    const csv = [headers.join(","), ...rowsCsv.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Report</CardTitle>
        <p className="text-sm text-muted-foreground">
          Users with programmes uploaded and activity counts.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={fetchData} disabled={loading}>
            {loading ? "Loading..." : "Generate"}
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <FileDown className="mr-2 size-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data. Click Generate to load.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Programmes</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.email}</TableCell>
                    <TableCell>{r.name ?? "—"}</TableCell>
                    <TableCell>{r.role}</TableCell>
                    <TableCell>{r.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>{r.programmes_uploaded}</TableCell>
                    <TableCell>{r.activity_count}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(r.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {rows.length} user(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProgrammeReport() {
  const [programmes, setProgrammes] = useState<ProgrammeRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [radioChannels, setRadioChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [radioChannelFilter, setRadioChannelFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((data) => setRadioChannels(Array.isArray(data) ? data : []))
      .catch(() => setRadioChannels([]));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (categoryFilter !== "all") params.set("category_id", categoryFilter);
      if (radioChannelFilter !== "all") params.set("radio_channel_id", radioChannelFilter);
      const res = await fetch(`/api/programmes?${params}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setProgrammes(data);
      else setProgrammes([]);
    } catch {
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Title", "Broadcasted Date", "Category", "Subcategory", "Radio Channel", "Slug"];
    const rows = programmes.map((p) => [
      p.title,
      formatDateOnlyDisplay(p.broadcasted_date) || p.broadcasted_date,
      (p.category as Category)?.name ?? "",
      (p.subcategory as Subcategory)?.name ?? "",
      (p.category as { radio_channel?: RadioChannel })?.radio_channel?.name ?? "",
      p.slug,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `programme-report-${dateFrom || "all"}-${dateTo || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Programme Report</CardTitle>
        <p className="text-sm text-muted-foreground">
          List of programmes. Filter by date range and category.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Date from</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Date to</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Radio channel</Label>
            <Select value={radioChannelFilter} onValueChange={setRadioChannelFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {radioChannels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={programmes.length === 0}>
              <FileDown className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : programmes.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No data. Set filters and click Generate.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Title</TableHead>
                  <TableHead>Broadcasted</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Radio channel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programmes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{formatDateOnlyDisplay(p.broadcasted_date) || p.broadcasted_date}</TableCell>
                    <TableCell>{(p.category as Category)?.name ?? "—"}</TableCell>
                    <TableCell>{(p.subcategory as Subcategory)?.name ?? "—"}</TableCell>
                    <TableCell>{(p.category as { radio_channel?: RadioChannel })?.radio_channel?.name ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!loading && programmes.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {programmes.length} programme(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
