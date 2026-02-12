import { Metadata } from "next";
import { SchedulePageClient } from "./schedule-client";

export const metadata: Metadata = {
  title: "Broadcast Schedule | All Radio Programmes Library",
  description: "View when each programme category airs on radio channels. Weekly and daily schedules.",
};

export default function SchedulePage() {
  return <SchedulePageClient />;
}
