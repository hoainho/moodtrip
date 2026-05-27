export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          home_province: string | null;
          paid_plan: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          home_province?: string | null;
          paid_plan?: boolean;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          home_province?: string | null;
          paid_plan?: boolean;
        };
        Relationships: [];
      };
      preferences: {
        Row: {
          user_id: string;
          preferred_moods: string[];
          preferred_short_moods: string[];
          default_budget: number | null;
          default_start_location: string | null;
          dietary_notes: string | null;
          mobility_notes: string | null;
          language: string;
          region_dialect: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_moods?: string[];
          preferred_short_moods?: string[];
          default_budget?: number | null;
          default_start_location?: string | null;
          dietary_notes?: string | null;
          mobility_notes?: string | null;
          language?: string;
          region_dialect?: string | null;
        };
        Update: {
          preferred_moods?: string[];
          preferred_short_moods?: string[];
          default_budget?: number | null;
          default_start_location?: string | null;
          dietary_notes?: string | null;
          mobility_notes?: string | null;
          language?: string;
          region_dialect?: string | null;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          destination: string;
          trip_mode: 'long' | 'short';
          form_input: Json;
          skeleton: Json;
          enrichment: Json | null;
          is_public: boolean;
          share_slug: string | null;
          parent_remix_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          destination: string;
          trip_mode: 'long' | 'short';
          form_input: Json;
          skeleton: Json;
          enrichment?: Json | null;
          is_public?: boolean;
          share_slug?: string | null;
          parent_remix_id?: string | null;
        };
        Update: {
          destination?: string;
          form_input?: Json;
          skeleton?: Json;
          enrichment?: Json | null;
          is_public?: boolean;
          share_slug?: string | null;
        };
        Relationships: [];
      };
      consent_log: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_token_hash: string | null;
          consent_version: string;
          consent_scope: string[];
          accepted_at: string;
          user_agent: string | null;
          ip_country: string | null;
        };
        Insert: {
          user_id?: string | null;
          anonymous_token_hash?: string | null;
          consent_version: string;
          consent_scope: string[];
          user_agent?: string | null;
          ip_country?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json | null;
        };
        Update: never;
        Relationships: [];
      };
    };
  };
}
