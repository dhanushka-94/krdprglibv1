import { z } from "zod";

/**
 * Slugify for URLs: keeps Unicode letters (Sinhala, Tamil, etc.) and numbers.
 * Falls back to a short id when the result would be empty (e.g. title was only symbols).
 */
function slugify(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  // \p{L} = any Unicode letter, \p{N} = any Unicode number; keep spaces and hyphens
  const unicodeSafe = trimmed
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return unicodeSafe || "";
}

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().optional(),
});

export const subcategorySchema = z.object({
  category_id: z.string().uuid("Select a category"),
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().optional(),
});

export const audioProgrammeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  broadcasted_date: z.string().min(1, "Broadcasted date is required"),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
  seo_keywords: z.string().max(255).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
export type AudioProgrammeFormValues = z.infer<typeof audioProgrammeSchema>;

export { slugify };
