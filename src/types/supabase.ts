export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      github_event_log: {
        Row: {
          action: string | null;
          created_at: string;
          event_type: string;
          id: string;
          last_processed: string | null;
          org: string;
          raw_payload: Json;
          repo: string;
        };
        Insert: {
          action?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          last_processed?: string | null;
          org: string;
          raw_payload: Json;
          repo: string;
        };
        Update: {
          action?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          last_processed?: string | null;
          org?: string;
          raw_payload?: Json;
          repo?: string;
        };
        Relationships: [];
      };
      public_timeline: {
        Row: {
          categories: string[] | null;
          created_at: string;
          data: Json;
          dedupe_hash: string;
          event_ids: string[] | null;
          id: string;
          is_read: boolean;
          repo_id: string;
          score: number;
          snooze_to: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          categories?: string[] | null;
          created_at?: string;
          data: Json;
          dedupe_hash: string;
          event_ids?: string[] | null;
          id?: string;
          is_read?: boolean;
          repo_id: string;
          score: number;
          snooze_to?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          categories?: string[] | null;
          created_at?: string;
          data?: Json;
          dedupe_hash?: string;
          event_ids?: string[] | null;
          id?: string;
          is_read?: boolean;
          repo_id?: string;
          score?: number;
          snooze_to?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_timeline_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          }
        ];
      };
      repositories: {
        Row: {
          champion_github_username: string | null;
          created_at: string;
          id: string;
          metadata: Json | null;
          org: string;
          repo: string;
        };
        Insert: {
          champion_github_username?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          org: string;
          repo: string;
        };
        Update: {
          champion_github_username?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          org?: string;
          repo?: string;
        };
        Relationships: [];
      };
      repositories_secure: {
        Row: {
          access_token: string | null;
          created_at: string;
          id: string;
          settings: Json | null;
        };
        Insert: {
          access_token?: string | null;
          created_at?: string;
          id?: string;
          settings?: Json | null;
        };
        Update: {
          access_token?: string | null;
          created_at?: string;
          id?: string;
          settings?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "repositories_secure_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          }
        ];
      };
      repositories_users: {
        Row: {
          created_at: string;
          id: string;
          repo_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          repo_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          repo_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repositories_users_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          created_at: string;
          id: string;
          repo_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          repo_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          repo_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          }
        ];
      };
      timeline_likes: {
        Row: {
          created_at: string;
          dedupe_hash: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dedupe_hash: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dedupe_hash?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_timeline: {
        Row: {
          categories: string[] | null;
          created_at: string;
          data: Json;
          dedupe_hash: string;
          event_ids: string[] | null;
          id: string;
          is_read: boolean;
          repo_id: string;
          score: number;
          snooze_to: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          categories?: string[] | null;
          created_at?: string;
          data: Json;
          dedupe_hash: string;
          event_ids?: string[] | null;
          id?: string;
          is_read?: boolean;
          repo_id: string;
          score: number;
          snooze_to?: string | null;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          categories?: string[] | null;
          created_at?: string;
          data?: Json;
          dedupe_hash?: string;
          event_ids?: string[] | null;
          id?: string;
          is_read?: boolean;
          repo_id?: string;
          score?: number;
          snooze_to?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_timeline_repo_id_fkey";
            columns: ["repo_id"];
            isOneToOne: false;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          github_username: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          github_username: string;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          github_username?: string;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
