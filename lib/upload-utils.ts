/** Sanitize for use in storage filename: letters, numbers, hyphens, underscores only. */
export function sanitizeForFilename(s: string): string {
  return (s || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^-+|-+$/g, "") || "Uncategorized";
}

/** Build storage filename: Category_Subcategory_YYYY-MM-DD_timestamp.mp3 */
export function buildProgrammeFilename(
  categoryName: string,
  subcategoryName: string,
  broadcastedDate: string
): string {
  const cat = sanitizeForFilename(categoryName) || "Uncategorized";
  const sub = sanitizeForFilename(subcategoryName) || "Uncategorized";
  const date = (broadcastedDate || "").trim().slice(0, 10) || "no-date";
  const timestamp = Date.now();
  return `${cat}_${sub}_${date}_${timestamp}.mp3`;
}
