export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
          updated_at?: string;
        };
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          slug?: string;
          display_order?: number;
          updated_at?: string;
        };
      };
      audio_programmes: {
        Row: {
          id: string;
          title: string;
          slug: string;
          broadcasted_date: string;
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
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          broadcasted_date: string;
          description?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          firebase_storage_url: string;
          firebase_storage_path: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          broadcasted_date?: string;
          description?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          firebase_storage_url?: string;
          firebase_storage_path?: string;
          file_size_bytes?: number | null;
          duration_seconds?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
