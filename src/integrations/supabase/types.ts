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
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          site_id: string | null
          title: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          site_id?: string | null
          title: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          site_id?: string | null
          title?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          backup_type: Database["public"]["Enums"]["backup_type"]
          created_at: string
          frequency: Database["public"]["Enums"]["backup_frequency"]
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          retention_days: number
          site_id: string
          updated_at: string
        }
        Insert: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["backup_frequency"]
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          retention_days?: number
          site_id: string
          updated_at?: string
        }
        Update: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["backup_frequency"]
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          retention_days?: number
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_schedules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          backup_type: Database["public"]["Enums"]["backup_type"]
          completed_at: string | null
          created_at: string
          expires_at: string | null
          file_path: string | null
          id: string
          name: string
          notes: string | null
          site_id: string
          size_mb: number
          status: Database["public"]["Enums"]["backup_status"]
        }
        Insert: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          name: string
          notes?: string | null
          site_id: string
          size_mb?: number
          status?: Database["public"]["Enums"]["backup_status"]
        }
        Update: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          name?: string
          notes?: string | null
          site_id?: string
          size_mb?: number
          status?: Database["public"]["Enums"]["backup_status"]
        }
        Relationships: [
          {
            foreignKeyName: "backups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_jobs: {
        Row: {
          command: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          job_type: Database["public"]["Enums"]["cron_job_type"]
          last_output: string | null
          last_run_at: string | null
          last_status: Database["public"]["Enums"]["cron_job_status"] | null
          name: string
          next_run_at: string | null
          schedule: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          command: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          job_type?: Database["public"]["Enums"]["cron_job_type"]
          last_output?: string | null
          last_run_at?: string | null
          last_status?: Database["public"]["Enums"]["cron_job_status"] | null
          name: string
          next_run_at?: string | null
          schedule: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          command?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          job_type?: Database["public"]["Enums"]["cron_job_type"]
          last_output?: string | null
          last_run_at?: string | null
          last_status?: Database["public"]["Enums"]["cron_job_status"] | null
          name?: string
          next_run_at?: string | null
          schedule?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cron_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
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
      email_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          password_hash: string | null
          quota_mb: number
          site_id: string
          updated_at: string
          used_mb: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          password_hash?: string | null
          quota_mb?: number
          site_id: string
          updated_at?: string
          used_mb?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          password_hash?: string | null
          quota_mb?: number
          site_id?: string
          updated_at?: string
          used_mb?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      email_autoresponders: {
        Row: {
          body: string
          created_at: string
          email_account_id: string
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          email_account_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          email_account_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_autoresponders_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_forwarders: {
        Row: {
          created_at: string
          destination_emails: string[]
          id: string
          is_active: boolean
          site_id: string
          source_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_emails?: string[]
          id?: string
          is_active?: boolean
          site_id: string
          source_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_emails?: string[]
          id?: string
          is_active?: boolean
          site_id?: string
          source_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_forwarders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_plugins: {
        Row: {
          config: Json | null
          created_at: string
          error_message: string | null
          id: string
          installed_at: string | null
          installed_version: string | null
          is_healthy: boolean | null
          last_health_check: string | null
          plugin_id: string
          status: Database["public"]["Enums"]["plugin_status"]
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          installed_at?: string | null
          installed_version?: string | null
          is_healthy?: boolean | null
          last_health_check?: string | null
          plugin_id: string
          status?: Database["public"]["Enums"]["plugin_status"]
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          installed_at?: string | null
          installed_version?: string | null
          is_healthy?: boolean | null
          last_health_check?: string | null
          plugin_id?: string
          status?: Database["public"]["Enums"]["plugin_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installed_plugins_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: true
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_installation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          installed_plugin_id: string
          is_error: boolean | null
          output: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          installed_plugin_id: string
          is_error?: boolean | null
          output?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          installed_plugin_id?: string
          is_error?: boolean | null
          output?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_installation_logs_installed_plugin_id_fkey"
            columns: ["installed_plugin_id"]
            isOneToOne: false
            referencedRelation: "installed_plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          apt_packages: string[] | null
          author: string | null
          category: Database["public"]["Enums"]["plugin_category"]
          config_template: Json | null
          created_at: string
          dependencies: string[] | null
          description: string | null
          display_name: string
          docker_image: string | null
          icon: string | null
          id: string
          is_core: boolean
          name: string
          updated_at: string
          version: string
        }
        Insert: {
          apt_packages?: string[] | null
          author?: string | null
          category?: Database["public"]["Enums"]["plugin_category"]
          config_template?: Json | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          display_name: string
          docker_image?: string | null
          icon?: string | null
          id?: string
          is_core?: boolean
          name: string
          updated_at?: string
          version?: string
        }
        Update: {
          apt_packages?: string[] | null
          author?: string | null
          category?: Database["public"]["Enums"]["plugin_category"]
          config_template?: Json | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          display_name?: string
          docker_image?: string | null
          icon?: string | null
          id?: string
          is_core?: boolean
          name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          password_changed_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          password_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          password_changed_at?: string | null
          updated_at?: string
        }
        Relationships: []
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
      system_metrics: {
        Row: {
          cpu_percent: number
          created_at: string
          disk_total_gb: number
          disk_used_gb: number
          id: string
          load_avg_15m: number | null
          load_avg_1m: number | null
          load_avg_5m: number | null
          memory_total_mb: number
          memory_used_mb: number
          network_in_mbps: number
          network_out_mbps: number
          recorded_at: string
          site_id: string | null
          uptime_seconds: number | null
        }
        Insert: {
          cpu_percent?: number
          created_at?: string
          disk_total_gb?: number
          disk_used_gb?: number
          id?: string
          load_avg_15m?: number | null
          load_avg_1m?: number | null
          load_avg_5m?: number | null
          memory_total_mb?: number
          memory_used_mb?: number
          network_in_mbps?: number
          network_out_mbps?: number
          recorded_at?: string
          site_id?: string | null
          uptime_seconds?: number | null
        }
        Update: {
          cpu_percent?: number
          created_at?: string
          disk_total_gb?: number
          disk_used_gb?: number
          id?: string
          load_avg_15m?: number | null
          load_avg_1m?: number | null
          load_avg_5m?: number | null
          memory_total_mb?: number
          memory_used_mb?: number
          network_in_mbps?: number
          network_out_mbps?: number
          recorded_at?: string
          site_id?: string | null
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      cleanup_old_metrics: { Args: never; Returns: undefined }
      get_site_role: {
        Args: { _site_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["site_role"]
      }
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_type:
        | "login"
        | "logout"
        | "site_created"
        | "site_updated"
        | "site_deleted"
        | "database_created"
        | "database_deleted"
        | "backup_created"
        | "backup_restored"
        | "backup_deleted"
        | "file_uploaded"
        | "file_deleted"
        | "file_modified"
        | "user_invited"
        | "user_removed"
        | "role_changed"
        | "settings_updated"
        | "password_changed"
        | "security_alert"
      app_role: "super_admin" | "admin" | "user"
      backup_frequency: "daily" | "weekly" | "monthly"
      backup_status: "pending" | "in_progress" | "completed" | "failed"
      backup_type: "full" | "files" | "database" | "scheduled"
      cron_job_status: "success" | "failed" | "running"
      cron_job_type: "backup" | "cleanup" | "maintenance" | "custom"
      db_type: "mysql" | "postgresql" | "mariadb"
      plugin_category:
        | "web_server"
        | "email"
        | "ftp"
        | "dns"
        | "backup"
        | "database"
        | "file_manager"
        | "security"
        | "monitoring"
        | "other"
      plugin_status:
        | "available"
        | "installing"
        | "installed"
        | "failed"
        | "uninstalling"
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
      activity_type: [
        "login",
        "logout",
        "site_created",
        "site_updated",
        "site_deleted",
        "database_created",
        "database_deleted",
        "backup_created",
        "backup_restored",
        "backup_deleted",
        "file_uploaded",
        "file_deleted",
        "file_modified",
        "user_invited",
        "user_removed",
        "role_changed",
        "settings_updated",
        "password_changed",
        "security_alert",
      ],
      app_role: ["super_admin", "admin", "user"],
      backup_frequency: ["daily", "weekly", "monthly"],
      backup_status: ["pending", "in_progress", "completed", "failed"],
      backup_type: ["full", "files", "database", "scheduled"],
      cron_job_status: ["success", "failed", "running"],
      cron_job_type: ["backup", "cleanup", "maintenance", "custom"],
      db_type: ["mysql", "postgresql", "mariadb"],
      plugin_category: [
        "web_server",
        "email",
        "ftp",
        "dns",
        "backup",
        "database",
        "file_manager",
        "security",
        "monitoring",
        "other",
      ],
      plugin_status: [
        "available",
        "installing",
        "installed",
        "failed",
        "uninstalling",
      ],
      site_role: ["owner", "admin", "developer", "viewer"],
      site_status: ["active", "pending", "suspended", "error"],
      site_type: ["wordpress", "nodejs", "python", "php", "static", "custom"],
    },
  },
} as const
