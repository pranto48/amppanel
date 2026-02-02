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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      databases: {
        Row: {
          created_at: string
          db_charset: string | null
          db_collation: string | null
          db_type: Database["public"]["Enums"]["db_type"]
          id: string
          name: string
          password_hash: string | null
          site_id: string
          size_mb: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          db_charset?: string | null
          db_collation?: string | null
          db_type?: Database["public"]["Enums"]["db_type"]
          id?: string
          name: string
          password_hash?: string | null
          site_id: string
          size_mb?: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          db_charset?: string | null
          db_collation?: string | null
          db_type?: Database["public"]["Enums"]["db_type"]
          id?: string
          name?: string
          password_hash?: string | null
          site_id?: string
          size_mb?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "databases_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["site_role"]
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["site_role"]
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["site_role"]
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          bandwidth_limit_gb: number
          bandwidth_used_gb: number
          created_at: string
          document_root: string | null
          domain: string
          ftp_password_hash: string | null
          ftp_username: string | null
          id: string
          php_version: string | null
          site_type: Database["public"]["Enums"]["site_type"]
          ssl_enabled: boolean
          ssl_expiry: string | null
          status: Database["public"]["Enums"]["site_status"]
          storage_limit_mb: number
          storage_used_mb: number
          updated_at: string
        }
        Insert: {
          bandwidth_limit_gb?: number
          bandwidth_used_gb?: number
          created_at?: string
          document_root?: string | null
          domain: string
          ftp_password_hash?: string | null
          ftp_username?: string | null
          id?: string
          php_version?: string | null
          site_type?: Database["public"]["Enums"]["site_type"]
          ssl_enabled?: boolean
          ssl_expiry?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          storage_limit_mb?: number
          storage_used_mb?: number
          updated_at?: string
        }
        Update: {
          bandwidth_limit_gb?: number
          bandwidth_used_gb?: number
          created_at?: string
          document_root?: string | null
          domain?: string
          ftp_password_hash?: string | null
          ftp_username?: string | null
          id?: string
          php_version?: string | null
          site_type?: Database["public"]["Enums"]["site_type"]
          ssl_enabled?: boolean
          ssl_expiry?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          storage_limit_mb?: number
          storage_used_mb?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_site_role: {
        Args: { _site_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["site_role"]
      }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      db_type: "mysql" | "postgresql" | "mariadb"
      site_role: "owner" | "admin" | "developer" | "viewer"
      site_status: "active" | "pending" | "suspended" | "error"
      site_type: "wordpress" | "nodejs" | "python" | "php" | "static" | "custom"
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
      db_type: ["mysql", "postgresql", "mariadb"],
      site_role: ["owner", "admin", "developer", "viewer"],
      site_status: ["active", "pending", "suspended", "error"],
      site_type: ["wordpress", "nodejs", "python", "php", "static", "custom"],
    },
  },
} as const
