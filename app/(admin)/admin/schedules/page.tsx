"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import type { Category, RadioChannel } from "@/lib/types";
import { AdminOnlyGuard } from "@/components/admin-only-guard";

type ScheduleRow = {
  id: string;
  category_id: string;
  radio_channel_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_daily: boolean;
  display_order: number;
  category?: { id: string; name: string };
  radio_channel?: { id: string; name: string };
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = parseInt(h ?? "0", 10);
  const mm = (m ?? "00").slice(0, 2);
  return `${hh}:${mm}`;
}

export default function SchedulesPage() {
  return (
    <AdminOnlyGuard>
      <SchedulesContent />
    </AdminOnlyGuard>
  );
}

function SchedulesContent() {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRow | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [radioChannelId, setRadioChannelId] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/category-schedules");
      const data = await res.json();
      if (res.ok) setSchedules(Array.isArray(data) ? data : []);
      else toast.error(data.error || "Failed to fetch");
    } catch {
      toast.error("Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/radio-channels")
      .then((r) => r.json())
      .then((d) => setChannels(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetchSchedules();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setCategoryId("");
    setRadioChannelId("");
    setIsDaily(false);
    setDayOfWeek(1);
    setStartTime("08:00");
    setEndTime("09:00");
    setDialogOpen(true);
  };

  const openEdit = (s: ScheduleRow) => {
    setEditing(s);
    setCategoryId(s.category_id);
    setRadioChannelId(s.radio_channel_id);
    setIsDaily(s.is_daily);
    setDayOfWeek(s.day_of_week ?? 1);
    setStartTime(formatTime(s.start_time));
    setEndTime(formatTime(s.end_time));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !radioChannelId || !startTime || !endTime) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        category_id: categoryId,
        radio_channel_id: radioChannelId,
        is_daily: isDaily,
        day_of_week: isDaily ? null : dayOfWeek,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      };
      const url = editing ? `/api/category-schedules/${editing.id}` : "/api/category-schedules";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? "Schedule updated" : "Schedule added");
        setDialogOpen(false);
        fetchSchedules();
      } else toast.error(data.error || "Failed to save");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`/api/category-schedules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Schedule deleted");
        fetchSchedules();
      } else toast.error(data.error || "Failed to delete");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <CalendarClock className="size-7" />
          Broadcast Schedules
        </h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add Schedule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Time Slots</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set when each category airs per radio channel. Daily = every day; Weekly = specific day of week.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : schedules.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No schedules yet. Add one to define when programmes air.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {(s.category as { name?: string })?.name ?? s.category_id}
                    </TableCell>
                    <TableCell>
                      {(s.radio_channel as { name?: string })?.name ?? s.radio_channel_id}
                    </TableCell>
                    <TableCell>{s.is_daily ? "Daily" : DAYS[s.day_of_week ?? 0]}</TableCell>
                    <TableCell>
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} aria-label="Delete">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Radio Channel</Label>
              <Select value={radioChannelId} onValueChange={setRadioChannelId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={isDaily ? "daily" : "weekly"} onValueChange={(v) => setIsDaily(v === "daily")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (specific day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isDaily && (
              <div>
                <Label>Day of Week</Label>
                <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(parseInt(v, 10))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
