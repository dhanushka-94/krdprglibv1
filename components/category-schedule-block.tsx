"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Radio } from "lucide-react";

type ScheduleItem = {
  id: string;
  category_id: string;
  radio_channel_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_daily: boolean;
  radio_channel?: { id: string; name: string; frequency?: string; frequency_2?: string; logo_url?: string };
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = parseInt(h ?? "0", 10);
  const mm = (m ?? "00").slice(0, 2);
  return `${hh}:${mm}`;
}

function formatSlot(s: ScheduleItem) {
  const time = `${formatTime(s.start_time)} – ${formatTime(s.end_time)}`;
  if (s.is_daily) return `Daily ${time}`;
  return `${DAYS[s.day_of_week ?? 0]} ${time}`;
}

interface CategoryScheduleBlockProps {
  categoryId: string;
  categoryName?: string;
  className?: string;
}

export function CategoryScheduleBlock({
  categoryId,
  categoryName,
  className,
}: CategoryScheduleBlockProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }
    fetch(`/api/category-schedules?category_id=${encodeURIComponent(categoryId)}`)
      .then((r) => r.json())
      .then((d) => setSchedules(Array.isArray(d) ? d : []))
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading || schedules.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <CalendarClock className="size-4" />
        Broadcast times
      </h2>
      <ul className="space-y-2">
        {schedules.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Radio className="size-4 shrink-0" />
              {(s.radio_channel as { name?: string })?.name ?? "Channel"}
            </span>
            <span className="text-foreground">{formatSlot(s)}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/schedule"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        View full schedule
      </Link>
    </section>
  );
}
