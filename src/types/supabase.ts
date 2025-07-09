export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
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
          search_text: string | null;
          search_vector: unknown | null;
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
          search_text?: string | null;
          search_vector?: unknown | null;
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
          search_text?: string | null;
          search_vector?: unknown | null;
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
          },
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
          created_at: string;
          id: string;
          installation_id: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          installation_id: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          installation_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "repositories_secure_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "repositories";
            referencedColumns: ["id"];
          },
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
          },
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
          },
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
          },
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
          search_text: string | null;
          search_vector: unknown | null;
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
          search_text?: string | null;
          search_vector?: unknown | null;
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
          search_text?: string | null;
          search_vector?: unknown | null;
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
          },
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
      get_batch_like_data: {
        Args: { dedupe_hashes: string[]; user_id_param?: string };
        Returns: {
          dedupe_hash: string;
          like_count: number;
          user_liked: boolean;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
