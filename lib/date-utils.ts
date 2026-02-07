/**
 * Sri Lanka timezone (Asia/Colombo, UTC+5:30)
 */
const SRI_LANKA_TZ = "Asia/Colombo";

/**
 * Format ISO date string to Sri Lankan date/time
 */
export function formatDateSriLanka(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    timeZone: SRI_LANKA_TZ,
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

/**
 * Format ISO date string to Sri Lankan date only
 */
export function formatDateOnlySriLanka(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", {
    timeZone: SRI_LANKA_TZ,
    dateStyle: "medium",
  });
}

/**
 * Format ISO date string to Sri Lankan time only
 */
export function formatTimeSriLanka(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-LK", {
    timeZone: SRI_LANKA_TZ,
    timeStyle: "medium",
  });
}

/**
 * Get current date in Sri Lankan timezone (YYYY-MM-DD for inputs)
 */
export function getTodaySriLanka(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA", { timeZone: SRI_LANKA_TZ });
}

/**
 * Format YYYY-MM-DD date string in Sri Lankan style
 */
export function formatDateOnlyDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00.000Z");
  return d.toLocaleDateString("en-LK", {
    timeZone: SRI_LANKA_TZ,
    dateStyle: "medium",
  });
}

/**
 * Format duration in seconds to m:ss or h:mm:ss
 */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
