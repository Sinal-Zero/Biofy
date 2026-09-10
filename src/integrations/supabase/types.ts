export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          block_id: string | null;
          created_at: string;
          id: number;
          kind: string;
          page_id: string;
          referrer: string | null;
        };
        Insert: {
          block_id?: string | null;
          created_at?: string;
          id?: number;
          kind: string;
          page_id: string;
          referrer?: string | null;
        };
        Update: {
          block_id?: string | null;
          created_at?: string;
          id?: number;
          kind?: string;
          page_id?: string;
          referrer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "page_blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_blocks: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          is_visible: boolean;
          page_id: string;
          position: number;
          title: string | null;
          type: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          page_id: string;
          position?: number;
          title?: string | null;
          type?: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          page_id?: string;
          position?: number;
          title?: string | null;
          type?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "page_blocks_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          created_at: string;
          id: string;
          is_published: boolean;
          published_at: string | null;
          template: string;
          theme: Json;
          updated_at: string;
          user_id: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          template?: string;
          theme?: Json;
          updated_at?: string;
          user_id: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          template?: string;
          theme?: Json;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          display_name: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          display_name?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          display_name?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          current_period_end: string | null;
          id: string;
          interval: string;
          plan: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          interval?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          interval?: string;
          plan?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { is_username_available: { Args: { candidate: string }; Returns: boolean } };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
