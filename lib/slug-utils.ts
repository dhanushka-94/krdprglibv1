/**
 * Decode and normalize a URL slug.
 * Strips share-text artifacts like " Listen: Title" that sometimes get appended to shared URLs.
 */
export function normalizeProgrammeSlug(slug: string): string {
  try {
    const decoded = slug.includes("%") ? decodeURIComponent(slug) : slug;
    const withoutListen = decoded.replace(/\s+Listen:.*$/i, "").trim();
    return withoutListen || decoded;
  } catch {
    return slug;
  }
}
