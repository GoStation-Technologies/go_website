export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_events: {
        Row: {
          created_at: string
          current_count: number | null
          id: number
          ip_hash: string | null
          key: string | null
          lang: string | null
          metadata: Json
          reason: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          current_count?: number | null
          id?: number
          ip_hash?: string | null
          key?: string | null
          lang?: string | null
          metadata?: Json
          reason: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          current_count?: number | null
          id?: number
          ip_hash?: string | null
          key?: string | null
          lang?: string | null
          metadata?: Json
          reason?: string
          session_id?: string | null
        }
        Relationships: []
      }
      acquisition_requests: {
        Row: {
          assigned_to: string | null
          avg_daily_sales_sar: number | null
          city: string | null
          created_at: string
          current_services: string[] | null
          district: string | null
          email: string
          fuel_pumps_count: number | null
          full_name: string
          id: string
          internal_notes: string | null
          land_area_sqm: number | null
          location_lat: number | null
          location_lng: number | null
          location_map_url: string | null
          notes: string | null
          phone: string
          reference: string
          station_name: string | null
          station_photo_urls: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          avg_daily_sales_sar?: number | null
          city?: string | null
          created_at?: string
          current_services?: string[] | null
          district?: string | null
          email: string
          fuel_pumps_count?: number | null
          full_name: string
          id?: string
          internal_notes?: string | null
          land_area_sqm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          notes?: string | null
          phone: string
          reference?: string
          station_name?: string | null
          station_photo_urls?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          avg_daily_sales_sar?: number | null
          city?: string | null
          created_at?: string
          current_services?: string[] | null
          district?: string | null
          email?: string
          fuel_pumps_count?: number | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          land_area_sqm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          notes?: string | null
          phone?: string
          reference?: string
          station_name?: string | null
          station_photo_urls?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          diff: Json | null
          entity: string
          entity_ids: string[] | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          diff?: Json | null
          entity: string
          entity_ids?: string[] | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_ids?: string[] | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
        }
        Relationships: []
      }
      awards: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          issuer_ar: string | null
          issuer_en: string | null
          name_ar: string
          name_en: string
          sort_order: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          issuer_ar?: string | null
          issuer_en?: string | null
          name_ar: string
          name_en: string
          sort_order?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          issuer_ar?: string | null
          issuer_en?: string | null
          name_ar?: string
          name_en?: string
          sort_order?: number
          year?: number
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          ticket_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          ticket_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          reference: string
          status: string
          subject: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          reference?: string
          status?: string
          subject: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          reference?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          expires_at: string
          filters: Json
          finished_at: string | null
          id: string
          kind: string
          pages_processed: number
          processed_rows: number
          row_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["export_job_status"]
          storage_path: string | null
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          expires_at?: string
          filters?: Json
          finished_at?: string | null
          id?: string
          kind: string
          pages_processed?: number
          processed_rows?: number
          row_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_job_status"]
          storage_path?: string | null
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          expires_at?: string
          filters?: Json
          finished_at?: string | null
          id?: string
          kind?: string
          pages_processed?: number
          processed_rows?: number
          row_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["export_job_status"]
          storage_path?: string | null
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          created_at: string
          file_url: string
          id: string
          is_published: boolean
          published_at: string
          report_type: string
          report_year: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          is_published?: boolean
          published_at: string
          report_type: string
          report_year: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          is_published?: boolean
          published_at?: string
          report_type?: string
          report_year?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      franchise_applications: {
        Row: {
          assigned_to: string | null
          city: string
          cr_number: string | null
          created_at: string
          email: string
          financial_proof_url: string | null
          full_name: string
          id: string
          internal_notes: string | null
          investment_capital_sar: number | null
          land_area_sqm: number | null
          location_lat: number | null
          location_lng: number | null
          location_map_url: string | null
          national_id: string
          notes: string | null
          ownership_doc_url: string | null
          ownership_status: string | null
          phone: string
          proposed_city: string | null
          proposed_district: string | null
          reference: string
          site_photo_urls: string[] | null
          status: string
          tier: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city: string
          cr_number?: string | null
          created_at?: string
          email: string
          financial_proof_url?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          investment_capital_sar?: number | null
          land_area_sqm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          national_id: string
          notes?: string | null
          ownership_doc_url?: string | null
          ownership_status?: string | null
          phone: string
          proposed_city?: string | null
          proposed_district?: string | null
          reference?: string
          site_photo_urls?: string[] | null
          status?: string
          tier?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string
          cr_number?: string | null
          created_at?: string
          email?: string
          financial_proof_url?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          investment_capital_sar?: number | null
          land_area_sqm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_map_url?: string | null
          national_id?: string
          notes?: string | null
          ownership_doc_url?: string | null
          ownership_status?: string | null
          phone?: string
          proposed_city?: string | null
          proposed_district?: string | null
          reference?: string
          site_photo_urls?: string[] | null
          status?: string
          tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ir_inquiries: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          inquiry_type: string
          message: string
          organization: string | null
          phone: string | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          inquiry_type: string
          message: string
          organization?: string | null
          phone?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          inquiry_type?: string
          message?: string
          organization?: string | null
          phone?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          cv_url: string | null
          email: string
          full_name: string
          id: string
          job_id: string
          linkedin_url: string | null
          notes: string | null
          phone: string
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          job_id: string
          linkedin_url?: string | null
          notes?: string | null
          phone: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          job_id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          city: string
          created_at: string
          department: string
          description_ar: string | null
          description_en: string | null
          employment_type: string
          id: string
          is_active: boolean
          posted_at: string
          slug: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          department: string
          description_ar?: string | null
          description_en?: string | null
          employment_type: string
          id?: string
          is_active?: boolean
          posted_at?: string
          slug: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          department?: string
          description_ar?: string | null
          description_en?: string | null
          employment_type?: string
          id?: string
          is_active?: boolean
          posted_at?: string
          slug?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaders: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          photo_url: string | null
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          photo_url?: string | null
          sort_order?: number
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          photo_url?: string | null
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          author_id: string | null
          body_ar: string | null
          body_en: string | null
          cover_url: string | null
          created_at: string
          event_date: string | null
          event_location_ar: string | null
          event_location_en: string | null
          excerpt_ar: string | null
          excerpt_en: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          kind: string
          published_at: string | null
          slug: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          cover_url?: string | null
          created_at?: string
          event_date?: string | null
          event_location_ar?: string | null
          event_location_en?: string | null
          excerpt_ar?: string | null
          excerpt_en?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kind?: string
          published_at?: string | null
          slug: string
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_ar?: string | null
          body_en?: string | null
          cover_url?: string | null
          created_at?: string
          event_date?: string | null
          event_location_ar?: string | null
          event_location_en?: string | null
          excerpt_ar?: string | null
          excerpt_en?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kind?: string
          published_at?: string | null
          slug?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: number
          path: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          path: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          path?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          block_key: string
          content_ar: string | null
          content_en: string | null
          id: string
          page_key: string
          updated_at: string
        }
        Insert: {
          block_key: string
          content_ar?: string | null
          content_en?: string | null
          id?: string
          page_key: string
          updated_at?: string
        }
        Update: {
          block_key?: string
          content_ar?: string | null
          content_en?: string | null
          id?: string
          page_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_offers: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name_ar: string
          name_en: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_ar: string
          name_en: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      report_downloads: {
        Row: {
          downloaded_at: string
          id: string
          report_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          report_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_downloads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address_ar: string | null
          address_en: string | null
          city_ar: string
          city_en: string
          created_at: string
          district_ar: string | null
          district_en: string | null
          fuel_types: string[]
          google_place_id: string | null
          google_rating: number | null
          hours_close: string | null
          hours_open: string | null
          id: string
          is_24h: boolean
          is_active: boolean
          lat: number
          lng: number
          name_ar: string
          name_en: string
          photo_url: string | null
          services: string[]
          updated_at: string
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          city_ar: string
          city_en: string
          created_at?: string
          district_ar?: string | null
          district_en?: string | null
          fuel_types?: string[]
          google_place_id?: string | null
          google_rating?: number | null
          hours_close?: string | null
          hours_open?: string | null
          id?: string
          is_24h?: boolean
          is_active?: boolean
          lat: number
          lng: number
          name_ar: string
          name_en: string
          photo_url?: string | null
          services?: string[]
          updated_at?: string
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          city_ar?: string
          city_en?: string
          created_at?: string
          district_ar?: string | null
          district_en?: string | null
          fuel_types?: string[]
          google_place_id?: string | null
          google_rating?: number | null
          hours_close?: string | null
          hours_open?: string | null
          id?: string
          is_24h?: boolean
          is_active?: boolean
          lat?: number
          lng?: number
          name_ar?: string
          name_en?: string
          photo_url?: string | null
          services?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          contact: string | null
          created_at: string
          full_name: string | null
          handoff_requested: boolean
          id: string
          internal_notes: string | null
          issue: string
          reference: string
          station_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          full_name?: string | null
          handoff_requested?: boolean
          id?: string
          internal_notes?: string | null
          issue: string
          reference?: string
          station_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          full_name?: string | null
          handoff_requested?: boolean
          id?: string
          internal_notes?: string | null
          issue?: string
          reference?: string
          station_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_cache: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      export_jobs_lease: {
        Args: { _limit?: number }
        Returns: {
          attempts: number
          created_at: string
          error: string | null
          expires_at: string
          filters: Json
          finished_at: string | null
          id: string
          kind: string
          pages_processed: number
          processed_rows: number
          row_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["export_job_status"]
          storage_path: string | null
          total_rows: number | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "export_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_reference: { Args: { prefix: string }; Returns: string }
      rate_limit_hit: {
        Args: { _key: string; _limit: number; _window_seconds: number }
        Returns: {
          allowed: boolean
          current_count: number
          reset_at: string
        }[]
      }
      rate_limit_purge: {
        Args: { _older_than_seconds?: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "super_admin" | "bd" | "hr" | "media" | "ir" | "ops" | "support"
      export_job_status:
        | "queued"
        | "processing"
        | "ready"
        | "failed"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "bd", "hr", "media", "ir", "ops", "support"],
      export_job_status: ["queued", "processing", "ready", "failed", "expired"],
    },
  },
} as const
