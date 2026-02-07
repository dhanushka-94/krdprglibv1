import { supabase } from "@/lib/supabase";

const DEFAULTS = {
  site_logo_url: "",
  site_favicon_url: "",
  footer_credits: "© {year} Television and Farm Broadcasting Service · Department of Agriculture, Sri Lanka",
} as const;

export interface PublicSettings {
  logo_url: string;
  favicon_url: string;
  footer_credits: string;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const keys = ["site_logo_url", "site_favicon_url", "footer_credits"];
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    console.error("getPublicSettings:", error);
    return {
      logo_url: DEFAULTS.site_logo_url,
      favicon_url: DEFAULTS.site_favicon_url,
      footer_credits: DEFAULTS.footer_credits,
    };
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value ?? "";
  }

  return {
    logo_url: (map.site_logo_url ?? DEFAULTS.site_logo_url).trim(),
    favicon_url: (map.site_favicon_url ?? DEFAULTS.site_favicon_url).trim(),
    footer_credits: (map.footer_credits ?? DEFAULTS.footer_credits).trim(),
  };
}
