export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface RadioChannel {
  id: string;
  name: string;
  frequency: string | null;
  frequency_2: string | null;
  logo_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AudioProgramme {
  id: string;
  title: string;
  slug: string;
  broadcasted_date: string;
  repeat_broadcasted_date: string | null;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  firebase_storage_url: string;
  firebase_storage_path: string;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
  radio_channel_id?: string | null;
  category?: Category | null;
  subcategory?: Subcategory | null;
  radio_channel?: RadioChannel | null;
}
