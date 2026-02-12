import type { Lang } from "@/lib/types";

/**
 * Resolve a multilingual name. Falls back to English (`name`) when the
 * requested translation is empty.
 */
export function localizedName(
  item: { name: string; name_si?: string; name_ta?: string } | null | undefined,
  lang: Lang
): string {
  if (!item) return "";
  if (lang === "si" && item.name_si) return item.name_si;
  if (lang === "ta" && item.name_ta) return item.name_ta;
  return item.name;
}
