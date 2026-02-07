import { supabase } from "@/lib/supabase";

export interface PublicSiteSettings {
  system_name: string;
  logo_url: string;
  favicon_url: string;
  footer_credits: string;
  maintenance_mode: boolean;
}

const DEFAULTS: PublicSiteSettings = {
  system_name: "Television and Farm Broadcasting Service – All Radio Programmes Library",
  logo_url: "",
  favicon_url: "",
  footer_credits: "© {year} Television and Farm Broadcasting Service · Department of Agriculture, Sri Lanka",
  maintenance_mode: false,
};

export async function getPublicSettings(): Promise<PublicSiteSettings> {
  const keys = ["system_name", "logo_url", "favicon_url", "footer_credits", "maintenance_mode"];
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    console.error("getPublicSettings:", error);
    return DEFAULTS;
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }

  return {
    system_name: (map.system_name && map.system_name.trim()) || DEFAULTS.system_name,
    logo_url: map.logo_url ?? DEFAULTS.logo_url,
    favicon_url: map.favicon_url ?? DEFAULTS.favicon_url,
    footer_credits: map.footer_credits ?? DEFAULTS.footer_credits,
    maintenance_mode: map.maintenance_mode === "true",
  };
}
