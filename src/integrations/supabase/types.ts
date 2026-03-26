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
          checksum_sha256: string | null
          completed_at: string | null
          contains_database: boolean
          contains_files: boolean
          created_at: string
          expires_at: string | null
          file_path: string | null
          id: string
          metadata: Json
          name: string
          notes: string | null
          point_in_time_reference: string | null
          restore_preview: Json
          site_id: string
          size_mb: number
          status: Database["public"]["Enums"]["backup_status"]
          storage_bucket: string | null
          storage_path: string | null
          storage_provider: Database["public"]["Enums"]["offsite_storage_provider"] | null
          storage_region: string | null
          verification_checked_at: string | null
          verification_status: Database["public"]["Enums"]["backup_verification_status"]
        }
        Insert: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          checksum_sha256?: string | null
          completed_at?: string | null
          contains_database?: boolean
          contains_files?: boolean
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          point_in_time_reference?: string | null
          restore_preview?: Json
          site_id: string
          size_mb?: number
          status?: Database["public"]["Enums"]["backup_status"]
          storage_bucket?: string | null
          storage_path?: string | null
          storage_provider?: Database["public"]["Enums"]["offsite_storage_provider"] | null
          storage_region?: string | null
          verification_checked_at?: string | null
          verification_status?: Database["public"]["Enums"]["backup_verification_status"]
        }
        Update: {
          backup_type?: Database["public"]["Enums"]["backup_type"]
          checksum_sha256?: string | null
          completed_at?: string | null
          contains_database?: boolean
          contains_files?: boolean
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          point_in_time_reference?: string | null
          restore_preview?: Json
          site_id?: string
          size_mb?: number
          status?: Database["public"]["Enums"]["backup_status"]
          storage_bucket?: string | null
          storage_path?: string | null
          storage_provider?: Database["public"]["Enums"]["offsite_storage_provider"] | null
          storage_region?: string | null
          verification_checked_at?: string | null
          verification_status?: Database["public"]["Enums"]["backup_verification_status"]
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
      backup_restore_jobs: {
        Row: {
          backup_id: string
          created_at: string
          created_by: string | null
          id: string
          mode: Database["public"]["Enums"]["restore_mode"]
          overwrite_confirmed: boolean
          point_in_time_target: string | null
          preview_manifest: Json
          restore_database: boolean
          restore_files: boolean
          sandbox_preview_status: Database["public"]["Enums"]["restore_status"]
          sandbox_preview_summary: string | null
          site_id: string
          status: Database["public"]["Enums"]["restore_status"]
          status_log: string | null
          target_database: string | null
          target_path: string | null
          updated_at: string
        }
        Insert: {
          backup_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["restore_mode"]
          overwrite_confirmed?: boolean
          point_in_time_target?: string | null
          preview_manifest?: Json
          restore_database?: boolean
          restore_files?: boolean
          sandbox_preview_status?: Database["public"]["Enums"]["restore_status"]
          sandbox_preview_summary?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["restore_status"]
          status_log?: string | null
          target_database?: string | null
          target_path?: string | null
          updated_at?: string
        }
        Update: {
          backup_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["restore_mode"]
          overwrite_confirmed?: boolean
          point_in_time_target?: string | null
          preview_manifest?: Json
          restore_database?: boolean
          restore_files?: boolean
          sandbox_preview_status?: Database["public"]["Enums"]["restore_status"]
          sandbox_preview_summary?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["restore_status"]
          status_log?: string | null
          target_database?: string | null
          target_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_restore_jobs_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_restore_jobs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          job_id: string
          output: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_id: string
          output?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          job_id?: string
          output?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cron_job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "cron_jobs"
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
      file_malware_scans: {
        Row: {
          file_path: string
          id: string
          metadata: Json
          scan_summary: string | null
          scanned_at: string
          signature_version: string | null
          site_id: string
          status: Database["public"]["Enums"]["malware_scan_status"]
          threat_name: string | null
        }
        Insert: {
          file_path: string
          id?: string
          metadata?: Json
          scan_summary?: string | null
          scanned_at?: string
          signature_version?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["malware_scan_status"]
          threat_name?: string | null
        }
        Update: {
          file_path?: string
          id?: string
          metadata?: Json
          scan_summary?: string | null
          scanned_at?: string
          signature_version?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["malware_scan_status"]
          threat_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_malware_scans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      firewall_providers: {
        Row: {
          adapter_type: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          last_synced_at: string | null
          provider_name: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          adapter_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          provider_name: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          adapter_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          provider_name?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firewall_providers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      firewall_rules_v2: {
        Row: {
          action: string
          created_at: string
          description: string | null
          direction: string
          id: string
          is_enabled: boolean
          port: string
          priority: number
          protocol: string
          provider_id: string
          site_id: string | null
          source_cidr: string
          updated_at: string
        }
        Insert: {
          action?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_enabled?: boolean
          port: string
          priority?: number
          protocol?: string
          provider_id: string
          site_id?: string | null
          source_cidr?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_enabled?: boolean
          port?: string
          priority?: number
          protocol?: string
          provider_id?: string
          site_id?: string | null
          source_cidr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firewall_rules_v2_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "firewall_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firewall_rules_v2_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      file_operation_runs: {
        Row: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          operation: Database["public"]["Enums"]["file_operation_type"]
          output: string | null
          site_id: string
          source_path: string | null
          status: Database["public"]["Enums"]["file_operation_status"]
          target_path: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          operation: Database["public"]["Enums"]["file_operation_type"]
          output?: string | null
          site_id: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["file_operation_status"]
          target_path?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          operation?: Database["public"]["Enums"]["file_operation_type"]
          output?: string | null
          site_id?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["file_operation_status"]
          target_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_operation_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      file_version_history: {
        Row: {
          change_type: string
          content_hash: string | null
          content_preview: string | null
          created_at: string
          created_by: string | null
          diff_summary: string | null
          file_path: string
          id: string
          site_id: string
          version_number: number
        }
        Insert: {
          change_type?: string
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path: string
          id?: string
          site_id: string
          version_number: number
        }
        Update: {
          change_type?: string
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path?: string
          id?: string
          site_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_version_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_agents: {
        Row: {
          agent_version: string
          capabilities: Json
          created_at: string
          hostname: string
          id: string
          last_seen_at: string | null
          metadata: Json
          site_id: string | null
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
        }
        Insert: {
          agent_version: string
          capabilities?: Json
          created_at?: string
          hostname: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          site_id?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Update: {
          agent_version?: string
          capabilities?: Json
          created_at?: string
          hostname?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          site_id?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_agents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at: string
          detected_at: string
          id: string
          message: string
          metadata: Json
          resolved_at: string | null
          severity: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["monitoring_alert_status"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at?: string
          detected_at?: string
          id?: string
          message: string
          metadata?: Json
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          source_type: string
          status?: Database["public"]["Enums"]["monitoring_alert_status"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at?: string
          detected_at?: string
          id?: string
          message?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["monitoring_alert_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      login_geo_alerts: {
        Row: {
          acknowledged_at: string | null
          asn: string | null
          city: string | null
          country_code: string | null
          id: string
          is_acknowledged: boolean
          latitude: number | null
          login_at: string
          longitude: number | null
          reason: string | null
          region: string | null
          risk_score: number
          site_id: string | null
          source_ip: unknown | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          id?: string
          is_acknowledged?: boolean
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          reason?: string | null
          region?: string | null
          risk_score?: number
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          id?: string
          is_acknowledged?: boolean
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          reason?: string | null
          region?: string | null
          risk_score?: number
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_geo_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_geo_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      site_http_health_checks: {
        Row: {
          checked_at: string
          created_at: string
          expected_status: number
          id: string
          label: string
          last_status_code: number | null
          metadata: Json
          response_time_ms: number | null
          site_id: string
          ssl_expires_at: string | null
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
          url: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          expected_status?: number
          id?: string
          label: string
          last_status_code?: number | null
          metadata?: Json
          response_time_ms?: number | null
          site_id: string
          ssl_expires_at?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
          url: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          expected_status?: number
          id?: string
          label?: string
          last_status_code?: number | null
          metadata?: Json
          response_time_ms?: number | null
          site_id?: string
          ssl_expires_at?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_http_health_checks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_incidents: {
        Row: {
          created_at: string
          id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["incident_status"]
          summary: string | null
          timeline: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          timeline?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          timeline?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_incidents_site_id_fkey"
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
      app_templates: {
        Row: {
          created_at: string
          description: string | null
          document_root_suffix: string
          env_defaults: Json
          id: string
          name: string
          package_actions: Database["public"]["Enums"]["package_action_type"][]
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          startup_command: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_root_suffix?: string
          env_defaults?: Json
          id?: string
          name: string
          package_actions?: Database["public"]["Enums"]["package_action_type"][]
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          startup_command?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_root_suffix?: string
          env_defaults?: Json
          id?: string
          name?: string
          package_actions?: Database["public"]["Enums"]["package_action_type"][]
          runtime?: Database["public"]["Enums"]["app_template_runtime"]
          startup_command?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_app_installations: {
        Row: {
          app_name: string
          branch: string
          created_at: string
          id: string
          install_status: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at: string | null
          production_sync_notes: string | null
          repository_url: string | null
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection: Json
          runtime_version: string | null
          site_id: string
          staging_site_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          app_name: string
          branch?: string
          created_at?: string
          id?: string
          install_status?: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at?: string | null
          production_sync_notes?: string | null
          repository_url?: string | null
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection?: Json
          runtime_version?: string | null
          site_id: string
          staging_site_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          app_name?: string
          branch?: string
          created_at?: string
          id?: string
          install_status?: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at?: string | null
          production_sync_notes?: string | null
          repository_url?: string | null
          runtime?: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection?: Json
          runtime_version?: string | null
          site_id?: string
          staging_site_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_app_installations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_app_installations_staging_site_id_fkey"
            columns: ["staging_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_app_installations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "app_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      site_deploy_hooks: {
        Row: {
          branch: string
          created_at: string
          deploy_script: string
          hook_type: string
          id: string
          is_enabled: boolean
          repository_url: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          branch?: string
          created_at?: string
          deploy_script: string
          hook_type?: string
          id?: string
          is_enabled?: boolean
          repository_url?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          branch?: string
          created_at?: string
          deploy_script?: string
          hook_type?: string
          id?: string
          is_enabled?: boolean
          repository_url?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_deploy_hooks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_environment_variables: {
        Row: {
          created_at: string
          id: string
          is_secret: boolean
          key: string
          site_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_secret?: boolean
          key: string
          site_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_secret?: boolean
          key?: string
          site_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_environment_variables_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_package_action_runs: {
        Row: {
          action: Database["public"]["Enums"]["package_action_type"]
          created_at: string
          id: string
          output: string | null
          site_id: string
          status: string
        }
        Insert: {
          action: Database["public"]["Enums"]["package_action_type"]
          created_at?: string
          id?: string
          output?: string | null
          site_id: string
          status?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["package_action_type"]
          created_at?: string
          id?: string
          output?: string | null
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_package_action_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_process_health: {
        Row: {
          checked_at: string
          cpu_percent: number
          created_at: string
          id: string
          memory_mb: number
          metadata: Json
          process_name: string
          restart_count: number
          site_id: string
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
        }
        Insert: {
          checked_at?: string
          cpu_percent?: number
          created_at?: string
          id?: string
          memory_mb?: number
          metadata?: Json
          process_name: string
          restart_count?: number
          site_id: string
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Update: {
          checked_at?: string
          cpu_percent?: number
          created_at?: string
          id?: string
          memory_mb?: number
          metadata?: Json
          process_name?: string
          restart_count?: number
          site_id?: string
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_process_health_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_configs: {
        Row: {
          access_log_path: string | null
          created_at: string
          custom_runtime_config: Json
          custom_vhost_config: string | null
          error_log_path: string | null
          env_vars: Json
          generated_pool_config: string | null
          generated_vhost_config: string | null
          id: string
          last_applied_at: string | null
          last_deployment_status: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output: string | null
          last_test_passed: boolean | null
          last_tested_at: string | null
          last_validation_output: string | null
          listen_port: number | null
          php_ini_overrides: Json
          php_fpm_enabled: boolean
          php_fpm_max_children: number
          php_fpm_max_requests: number
          php_fpm_max_spare_servers: number
          php_fpm_min_spare_servers: number
          php_fpm_pm: string
          php_fpm_pool_name: string
          php_fpm_start_servers: number
          php_fpm_version: string | null
          proxy_target: string | null
          runtime_environment: Database["public"]["Enums"]["runtime_environment"]
          site_id: string
          template: Database["public"]["Enums"]["vhost_template_type"]
          updated_at: string
          web_server: Database["public"]["Enums"]["web_server_type"]
        }
        Insert: {
          access_log_path?: string | null
          created_at?: string
          custom_runtime_config?: Json
          custom_vhost_config?: string | null
          error_log_path?: string | null
          env_vars?: Json
          generated_pool_config?: string | null
          generated_vhost_config?: string | null
          id?: string
          last_applied_at?: string | null
          last_deployment_status?: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output?: string | null
          last_test_passed?: boolean | null
          last_tested_at?: string | null
          last_validation_output?: string | null
          listen_port?: number | null
          php_ini_overrides?: Json
          php_fpm_enabled?: boolean
          php_fpm_max_children?: number
          php_fpm_max_requests?: number
          php_fpm_max_spare_servers?: number
          php_fpm_min_spare_servers?: number
          php_fpm_pm?: string
          php_fpm_pool_name: string
          php_fpm_start_servers?: number
          php_fpm_version?: string | null
          proxy_target?: string | null
          runtime_environment?: Database["public"]["Enums"]["runtime_environment"]
          site_id: string
          template?: Database["public"]["Enums"]["vhost_template_type"]
          updated_at?: string
          web_server?: Database["public"]["Enums"]["web_server_type"]
        }
        Update: {
          access_log_path?: string | null
          created_at?: string
          custom_runtime_config?: Json
          custom_vhost_config?: string | null
          error_log_path?: string | null
          env_vars?: Json
          generated_pool_config?: string | null
          generated_vhost_config?: string | null
          id?: string
          last_applied_at?: string | null
          last_deployment_status?: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output?: string | null
          last_test_passed?: boolean | null
          last_tested_at?: string | null
          last_validation_output?: string | null
          listen_port?: number | null
          php_ini_overrides?: Json
          php_fpm_enabled?: boolean
          php_fpm_max_children?: number
          php_fpm_max_requests?: number
          php_fpm_max_spare_servers?: number
          php_fpm_min_spare_servers?: number
          php_fpm_pm?: string
          php_fpm_pool_name?: string
          php_fpm_start_servers?: number
          php_fpm_version?: string | null
          proxy_target?: string | null
          runtime_environment?: Database["public"]["Enums"]["runtime_environment"]
          site_id?: string
          template?: Database["public"]["Enums"]["vhost_template_type"]
          updated_at?: string
          web_server?: Database["public"]["Enums"]["web_server_type"]
        }
        Relationships: [
          {
            foreignKeyName: "site_service_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_logs: {
        Row: {
          config_id: string | null
          created_at: string
          id: string
          log_type: string
          message: string
          site_id: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string
          id?: string
          log_type: string
          message: string
          site_id: string
        }
        Update: {
          config_id?: string | null
          created_at?: string
          id?: string
          log_type?: string
          message?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_service_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "site_service_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_ssl_certificates: {
        Row: {
          alert_before_days: number
          alternate_names: string[]
          auto_redirect_http: boolean
          certificate_chain_diagnostics: string | null
          certificate_chain_issuer: string | null
          certificate_chain_valid: boolean | null
          certificate_status: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at: string
          dns_provider: string | null
          expires_at: string | null
          id: string
          is_wildcard: boolean
          issued_at: string | null
          last_alert_sent_at: string | null
          last_error: string | null
          primary_domain: string
          provider: string
          renewed_at: string | null
          revoked_at: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          alert_before_days?: number
          alternate_names?: string[]
          auto_redirect_http?: boolean
          certificate_chain_diagnostics?: string | null
          certificate_chain_issuer?: string | null
          certificate_chain_valid?: boolean | null
          certificate_status?: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type?: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at?: string
          dns_provider?: string | null
          expires_at?: string | null
          id?: string
          is_wildcard?: boolean
          issued_at?: string | null
          last_alert_sent_at?: string | null
          last_error?: string | null
          primary_domain: string
          provider?: string
          renewed_at?: string | null
          revoked_at?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          alert_before_days?: number
          alternate_names?: string[]
          auto_redirect_http?: boolean
          certificate_chain_diagnostics?: string | null
          certificate_chain_issuer?: string | null
          certificate_chain_valid?: boolean | null
          certificate_status?: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type?: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at?: string
          dns_provider?: string | null
          expires_at?: string | null
          id?: string
          is_wildcard?: boolean
          issued_at?: string | null
          last_alert_sent_at?: string | null
          last_error?: string | null
          primary_domain?: string
          provider?: string
          renewed_at?: string | null
          revoked_at?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_ssl_certificates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_deployments: {
        Row: {
          action: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config: string | null
          applied_vhost_config: string | null
          config_id: string
          created_at: string
          created_by: string | null
          id: string
          orchestration_log: string | null
          rollback_source_deployment_id: string | null
          site_id: string
          snapshot_pool_config: string | null
          snapshot_vhost_config: string | null
          status: Database["public"]["Enums"]["service_deployment_status"]
          validation_output: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config?: string | null
          applied_vhost_config?: string | null
          config_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          orchestration_log?: string | null
          rollback_source_deployment_id?: string | null
          site_id: string
          snapshot_pool_config?: string | null
          snapshot_vhost_config?: string | null
          status?: Database["public"]["Enums"]["service_deployment_status"]
          validation_output?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config?: string | null
          applied_vhost_config?: string | null
          config_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          orchestration_log?: string | null
          rollback_source_deployment_id?: string | null
          site_id?: string
          snapshot_pool_config?: string | null
          snapshot_vhost_config?: string | null
          status?: Database["public"]["Enums"]["service_deployment_status"]
          validation_output?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_service_deployments_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "site_service_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_deployments_rollback_source_deployment_id_fkey"
            columns: ["rollback_source_deployment_id"]
            isOneToOne: false
            referencedRelation: "site_service_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_deployments_site_id_fkey"
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
      service_control_runs: {
        Row: {
          action: Database["public"]["Enums"]["service_control_action"]
          config_test_passed: boolean | null
          created_at: string
          id: string
          output: string | null
          requested_by: string | null
          service_id: string
          status: Database["public"]["Enums"]["service_runtime_status"]
        }
        Insert: {
          action: Database["public"]["Enums"]["service_control_action"]
          config_test_passed?: boolean | null
          created_at?: string
          id?: string
          output?: string | null
          requested_by?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["service_runtime_status"]
        }
        Update: {
          action?: Database["public"]["Enums"]["service_control_action"]
          config_test_passed?: boolean | null
          created_at?: string
          id?: string
          output?: string | null
          requested_by?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["service_runtime_status"]
        }
        Relationships: [
          {
            foreignKeyName: "service_control_runs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_journal_entries: {
        Row: {
          id: string
          logged_at: string
          message: string
          service_id: string
          severity: string
          unit: string
        }
        Insert: {
          id?: string
          logged_at?: string
          message: string
          service_id: string
          severity?: string
          unit: string
        }
        Update: {
          id?: string
          logged_at?: string
          message?: string
          service_id?: string
          severity?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_journal_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_maintenance_actions: {
        Row: {
          action: Database["public"]["Enums"]["service_control_action"]
          action_name: string
          created_at: string
          cron_expression: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          next_run_at: string | null
          payload: Json
          service_id: string | null
          updated_at: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["service_control_action"]
          action_name: string
          created_at?: string
          cron_expression: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["service_control_action"]
          action_name?: string
          created_at?: string
          cron_expression?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_maintenance_actions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_package_updates: {
        Row: {
          applied_at: string | null
          available_at: string
          current_version: string
          id: string
          package_name: string
          service_id: string
          status: string
          summary: string | null
          target_version: string
        }
        Insert: {
          applied_at?: string | null
          available_at?: string
          current_version: string
          id?: string
          package_name: string
          service_id: string
          status?: string
          summary?: string | null
          target_version: string
        }
        Update: {
          applied_at?: string | null
          available_at?: string
          current_version?: string
          id?: string
          package_name?: string
          service_id?: string
          status?: string
          summary?: string | null
          target_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_package_updates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_reputation_events: {
        Row: {
          action_recommended: string | null
          categories: Json
          checked_at: string
          confidence: number | null
          details: Json
          id: string
          provider_name: string
          reputation_score: number | null
          site_id: string | null
          source_ip: unknown
        }
        Insert: {
          action_recommended?: string | null
          categories?: Json
          checked_at?: string
          confidence?: number | null
          details?: Json
          id?: string
          provider_name: string
          reputation_score?: number | null
          site_id?: string | null
          source_ip: unknown
        }
        Update: {
          action_recommended?: string | null
          categories?: Json
          checked_at?: string
          confidence?: number | null
          details?: Json
          id?: string
          provider_name?: string
          reputation_score?: number | null
          site_id?: string | null
          source_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "ip_reputation_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_scan_findings: {
        Row: {
          confidence: number
          detected_at: string
          detector: string
          file_path: string | null
          id: string
          is_resolved: boolean
          line_number: number | null
          match_preview: string | null
          resolved_at: string | null
          scan_id: string | null
          secret_type: string
          site_id: string | null
          source_kind: string
        }
        Insert: {
          confidence?: number
          detected_at?: string
          detector: string
          file_path?: string | null
          id?: string
          is_resolved?: boolean
          line_number?: number | null
          match_preview?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          secret_type: string
          site_id?: string | null
          source_kind?: string
        }
        Update: {
          confidence?: number
          detected_at?: string
          detector?: string
          file_path?: string | null
          id?: string
          is_resolved?: boolean
          line_number?: number | null
          match_preview?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          secret_type?: string
          site_id?: string | null
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_scan_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "site_security_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_scan_findings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          category: Database["public"]["Enums"]["audit_event_category"]
          created_at: string
          details: Json
          event_hash: string
          id: string
          prev_event_hash: string | null
          site_id: string | null
          source_ip: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          category: Database["public"]["Enums"]["audit_event_category"]
          created_at?: string
          details?: Json
          event_hash?: string
          id?: string
          prev_event_hash?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          category?: Database["public"]["Enums"]["audit_event_category"]
          created_at?: string
          details?: Json
          event_hash?: string
          id?: string
          prev_event_hash?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audit_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_security_scans: {
        Row: {
          findings: Json
          findings_count: number
          id: string
          scanned_at: string
          scan_type: Database["public"]["Enums"]["security_scan_type"]
          scanner_name: string
          severity: string
          site_id: string | null
          status: string
          summary: string | null
          target_path: string | null
        }
        Insert: {
          findings?: Json
          findings_count?: number
          id?: string
          scanned_at?: string
          scan_type: Database["public"]["Enums"]["security_scan_type"]
          scanner_name: string
          severity?: string
          site_id?: string | null
          status?: string
          summary?: string | null
          target_path?: string | null
        }
        Update: {
          findings?: Json
          findings_count?: number
          id?: string
          scanned_at?: string
          scan_type?: Database["public"]["Enums"]["security_scan_type"]
          scanner_name?: string
          severity?: string
          site_id?: string | null
          status?: string
          summary?: string | null
          target_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_security_scans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ssh_keys: {
        Row: {
          algorithm: string | null
          comment: string | null
          created_at: string
          fingerprint: string | null
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          public_key: string
          revoked_at: string | null
          site_id: string | null
          source_ip: unknown | null
          user_id: string | null
        }
        Insert: {
          algorithm?: string | null
          comment?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          public_key: string
          revoked_at?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Update: {
          algorithm?: string | null
          comment?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          public_key?: string
          revoked_at?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssh_keys_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssh_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waf_events: {
        Row: {
          action_taken: string
          country_code: string | null
          details: Json
          detected_at: string
          id: string
          policy_id: string | null
          request_path: string | null
          rule_id: string | null
          severity: string
          site_id: string | null
          source_ip: unknown | null
          threat_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_taken?: string
          country_code?: string | null
          details?: Json
          detected_at?: string
          id?: string
          policy_id?: string | null
          request_path?: string | null
          rule_id?: string | null
          severity?: string
          site_id?: string | null
          source_ip?: unknown | null
          threat_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_taken?: string
          country_code?: string | null
          details?: Json
          detected_at?: string
          id?: string
          policy_id?: string | null
          request_path?: string | null
          rule_id?: string | null
          severity?: string
          site_id?: string | null
          source_ip?: unknown | null
          threat_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waf_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "waf_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waf_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      waf_policies: {
        Row: {
          config: Json
          created_at: string
          engine: string
          id: string
          is_enabled: boolean
          mode: string
          policy_name: string
          ruleset_version: string | null
          site_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          engine?: string
          id?: string
          is_enabled?: boolean
          mode?: string
          policy_name: string
          ruleset_version?: string | null
          site_id?: string | null
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
      file_malware_scans: {
        Row: {
          file_path: string
          id: string
          metadata: Json
          scan_summary: string | null
          scanned_at: string
          signature_version: string | null
          site_id: string
          status: Database["public"]["Enums"]["malware_scan_status"]
          threat_name: string | null
        }
        Insert: {
          file_path: string
          id?: string
          metadata?: Json
          scan_summary?: string | null
          scanned_at?: string
          signature_version?: string | null
          site_id: string
          status?: Database["public"]["Enums"]["malware_scan_status"]
          threat_name?: string | null
        }
        Update: {
          file_path?: string
          id?: string
          metadata?: Json
          scan_summary?: string | null
          scanned_at?: string
          signature_version?: string | null
          site_id?: string
          status?: Database["public"]["Enums"]["malware_scan_status"]
          threat_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_malware_scans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      firewall_providers: {
        Row: {
          adapter_type: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          last_synced_at: string | null
          provider_name: string
          site_id: string | null
          updated_at: string
        }
        Insert: {
          adapter_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          provider_name: string
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          adapter_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          provider_name?: string
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firewall_providers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      firewall_rules_v2: {
        Row: {
          action: string
          created_at: string
          description: string | null
          direction: string
          id: string
          is_enabled: boolean
          port: string
          priority: number
          protocol: string
          provider_id: string
          site_id: string | null
          source_cidr: string
          updated_at: string
        }
        Insert: {
          action?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_enabled?: boolean
          port: string
          priority?: number
          protocol?: string
          provider_id: string
          site_id?: string | null
          source_cidr?: string
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_enabled?: boolean
          port?: string
          priority?: number
          protocol?: string
          provider_id?: string
          site_id?: string | null
          source_cidr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firewall_rules_v2_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "firewall_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firewall_rules_v2_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      file_operation_runs: {
        Row: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          operation: Database["public"]["Enums"]["file_operation_type"]
          output: string | null
          site_id: string
          source_path: string | null
          status: Database["public"]["Enums"]["file_operation_status"]
          target_path: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          operation: Database["public"]["Enums"]["file_operation_type"]
          output?: string | null
          site_id: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["file_operation_status"]
          target_path?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          operation?: Database["public"]["Enums"]["file_operation_type"]
          output?: string | null
          site_id?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["file_operation_status"]
          target_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_operation_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      file_version_history: {
        Row: {
          change_type: string
          content_hash: string | null
          content_preview: string | null
          created_at: string
          created_by: string | null
          diff_summary: string | null
          file_path: string
          id: string
          site_id: string
          version_number: number
        }
        Insert: {
          change_type?: string
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path: string
          id?: string
          site_id: string
          version_number: number
        }
        Update: {
          change_type?: string
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path?: string
          id?: string
          site_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_version_history_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_agents: {
        Row: {
          agent_version: string
          capabilities: Json
          created_at: string
          hostname: string
          id: string
          last_seen_at: string | null
          metadata: Json
          site_id: string | null
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
        }
        Insert: {
          agent_version: string
          capabilities?: Json
          created_at?: string
          hostname: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          site_id?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Update: {
          agent_version?: string
          capabilities?: Json
          created_at?: string
          hostname?: string
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          site_id?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_agents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at: string
          detected_at: string
          id: string
          message: string
          metadata: Json
          resolved_at: string | null
          severity: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["monitoring_alert_status"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at?: string
          detected_at?: string
          id?: string
          message: string
          metadata?: Json
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          source_type: string
          status?: Database["public"]["Enums"]["monitoring_alert_status"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: Database["public"]["Enums"]["monitoring_alert_type"]
          created_at?: string
          detected_at?: string
          id?: string
          message?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["monitoring_alert_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      login_geo_alerts: {
        Row: {
          acknowledged_at: string | null
          asn: string | null
          city: string | null
          country_code: string | null
          id: string
          is_acknowledged: boolean
          latitude: number | null
          login_at: string
          longitude: number | null
          reason: string | null
          region: string | null
          risk_score: number
          site_id: string | null
          source_ip: unknown | null
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          id?: string
          is_acknowledged?: boolean
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          reason?: string | null
          region?: string | null
          risk_score?: number
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          asn?: string | null
          city?: string | null
          country_code?: string | null
          id?: string
          is_acknowledged?: boolean
          latitude?: number | null
          login_at?: string
          longitude?: number | null
          reason?: string | null
          region?: string | null
          risk_score?: number
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_geo_alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_geo_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      site_http_health_checks: {
        Row: {
          checked_at: string
          created_at: string
          expected_status: number
          id: string
          label: string
          last_status_code: number | null
          metadata: Json
          response_time_ms: number | null
          site_id: string
          ssl_expires_at: string | null
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
          url: string
        }
        Insert: {
          checked_at?: string
          created_at?: string
          expected_status?: number
          id?: string
          label: string
          last_status_code?: number | null
          metadata?: Json
          response_time_ms?: number | null
          site_id: string
          ssl_expires_at?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
          url: string
        }
        Update: {
          checked_at?: string
          created_at?: string
          expected_status?: number
          id?: string
          label?: string
          last_status_code?: number | null
          metadata?: Json
          response_time_ms?: number | null
          site_id?: string
          ssl_expires_at?: string | null
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_http_health_checks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_incidents: {
        Row: {
          created_at: string
          id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["incident_status"]
          summary: string | null
          timeline: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          timeline?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["monitoring_alert_severity"]
          site_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string | null
          timeline?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_incidents_site_id_fkey"
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
      app_templates: {
        Row: {
          created_at: string
          description: string | null
          document_root_suffix: string
          env_defaults: Json
          id: string
          name: string
          package_actions: Database["public"]["Enums"]["package_action_type"][]
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          startup_command: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_root_suffix?: string
          env_defaults?: Json
          id?: string
          name: string
          package_actions?: Database["public"]["Enums"]["package_action_type"][]
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          startup_command?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_root_suffix?: string
          env_defaults?: Json
          id?: string
          name?: string
          package_actions?: Database["public"]["Enums"]["package_action_type"][]
          runtime?: Database["public"]["Enums"]["app_template_runtime"]
          startup_command?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_app_installations: {
        Row: {
          app_name: string
          branch: string
          created_at: string
          id: string
          install_status: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at: string | null
          production_sync_notes: string | null
          repository_url: string | null
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection: Json
          runtime_version: string | null
          site_id: string
          staging_site_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          app_name: string
          branch?: string
          created_at?: string
          id?: string
          install_status?: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at?: string | null
          production_sync_notes?: string | null
          repository_url?: string | null
          runtime: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection?: Json
          runtime_version?: string | null
          site_id: string
          staging_site_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          app_name?: string
          branch?: string
          created_at?: string
          id?: string
          install_status?: Database["public"]["Enums"]["app_install_status"]
          last_deployed_at?: string | null
          production_sync_notes?: string | null
          repository_url?: string | null
          runtime?: Database["public"]["Enums"]["app_template_runtime"]
          runtime_detection?: Json
          runtime_version?: string | null
          site_id?: string
          staging_site_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_app_installations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_app_installations_staging_site_id_fkey"
            columns: ["staging_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_app_installations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "app_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      site_deploy_hooks: {
        Row: {
          branch: string
          created_at: string
          deploy_script: string
          hook_type: string
          id: string
          is_enabled: boolean
          repository_url: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          branch?: string
          created_at?: string
          deploy_script: string
          hook_type?: string
          id?: string
          is_enabled?: boolean
          repository_url?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          branch?: string
          created_at?: string
          deploy_script?: string
          hook_type?: string
          id?: string
          is_enabled?: boolean
          repository_url?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_deploy_hooks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_environment_variables: {
        Row: {
          created_at: string
          id: string
          is_secret: boolean
          key: string
          site_id: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_secret?: boolean
          key: string
          site_id: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_secret?: boolean
          key?: string
          site_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_environment_variables_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_package_action_runs: {
        Row: {
          action: Database["public"]["Enums"]["package_action_type"]
          created_at: string
          id: string
          output: string | null
          site_id: string
          status: string
        }
        Insert: {
          action: Database["public"]["Enums"]["package_action_type"]
          created_at?: string
          id?: string
          output?: string | null
          site_id: string
          status?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["package_action_type"]
          created_at?: string
          id?: string
          output?: string | null
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_package_action_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_process_health: {
        Row: {
          checked_at: string
          cpu_percent: number
          created_at: string
          id: string
          memory_mb: number
          metadata: Json
          process_name: string
          restart_count: number
          site_id: string
          status: Database["public"]["Enums"]["health_status"]
          updated_at: string
        }
        Insert: {
          checked_at?: string
          cpu_percent?: number
          created_at?: string
          id?: string
          memory_mb?: number
          metadata?: Json
          process_name: string
          restart_count?: number
          site_id: string
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Update: {
          checked_at?: string
          cpu_percent?: number
          created_at?: string
          id?: string
          memory_mb?: number
          metadata?: Json
          process_name?: string
          restart_count?: number
          site_id?: string
          status?: Database["public"]["Enums"]["health_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_process_health_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_configs: {
        Row: {
          access_log_path: string | null
          created_at: string
          custom_runtime_config: Json
          custom_vhost_config: string | null
          error_log_path: string | null
          env_vars: Json
          generated_pool_config: string | null
          generated_vhost_config: string | null
          id: string
          last_applied_at: string | null
          last_deployment_status: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output: string | null
          last_test_passed: boolean | null
          last_tested_at: string | null
          last_validation_output: string | null
          listen_port: number | null
          php_ini_overrides: Json
          php_fpm_enabled: boolean
          php_fpm_max_children: number
          php_fpm_max_requests: number
          php_fpm_max_spare_servers: number
          php_fpm_min_spare_servers: number
          php_fpm_pm: string
          php_fpm_pool_name: string
          php_fpm_start_servers: number
          php_fpm_version: string | null
          proxy_target: string | null
          runtime_environment: Database["public"]["Enums"]["runtime_environment"]
          site_id: string
          template: Database["public"]["Enums"]["vhost_template_type"]
          updated_at: string
          web_server: Database["public"]["Enums"]["web_server_type"]
        }
        Insert: {
          access_log_path?: string | null
          created_at?: string
          custom_runtime_config?: Json
          custom_vhost_config?: string | null
          error_log_path?: string | null
          env_vars?: Json
          generated_pool_config?: string | null
          generated_vhost_config?: string | null
          id?: string
          last_applied_at?: string | null
          last_deployment_status?: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output?: string | null
          last_test_passed?: boolean | null
          last_tested_at?: string | null
          last_validation_output?: string | null
          listen_port?: number | null
          php_ini_overrides?: Json
          php_fpm_enabled?: boolean
          php_fpm_max_children?: number
          php_fpm_max_requests?: number
          php_fpm_max_spare_servers?: number
          php_fpm_min_spare_servers?: number
          php_fpm_pm?: string
          php_fpm_pool_name: string
          php_fpm_start_servers?: number
          php_fpm_version?: string | null
          proxy_target?: string | null
          runtime_environment?: Database["public"]["Enums"]["runtime_environment"]
          site_id: string
          template?: Database["public"]["Enums"]["vhost_template_type"]
          updated_at?: string
          web_server?: Database["public"]["Enums"]["web_server_type"]
        }
        Update: {
          access_log_path?: string | null
          created_at?: string
          custom_runtime_config?: Json
          custom_vhost_config?: string | null
          error_log_path?: string | null
          env_vars?: Json
          generated_pool_config?: string | null
          generated_vhost_config?: string | null
          id?: string
          last_applied_at?: string | null
          last_deployment_status?: Database["public"]["Enums"]["service_deployment_status"]
          last_test_output?: string | null
          last_test_passed?: boolean | null
          last_tested_at?: string | null
          last_validation_output?: string | null
          listen_port?: number | null
          php_ini_overrides?: Json
          php_fpm_enabled?: boolean
          php_fpm_max_children?: number
          php_fpm_max_requests?: number
          php_fpm_max_spare_servers?: number
          php_fpm_min_spare_servers?: number
          php_fpm_pm?: string
          php_fpm_pool_name?: string
          php_fpm_start_servers?: number
          php_fpm_version?: string | null
          proxy_target?: string | null
          runtime_environment?: Database["public"]["Enums"]["runtime_environment"]
          site_id?: string
          template?: Database["public"]["Enums"]["vhost_template_type"]
          updated_at?: string
          web_server?: Database["public"]["Enums"]["web_server_type"]
        }
        Relationships: [
          {
            foreignKeyName: "site_service_configs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_logs: {
        Row: {
          config_id: string | null
          created_at: string
          id: string
          log_type: string
          message: string
          site_id: string
        }
        Insert: {
          config_id?: string | null
          created_at?: string
          id?: string
          log_type: string
          message: string
          site_id: string
        }
        Update: {
          config_id?: string | null
          created_at?: string
          id?: string
          log_type?: string
          message?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_service_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "site_service_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_ssl_certificates: {
        Row: {
          alert_before_days: number
          alternate_names: string[]
          auto_redirect_http: boolean
          certificate_chain_diagnostics: string | null
          certificate_chain_issuer: string | null
          certificate_chain_valid: boolean | null
          certificate_status: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at: string
          dns_provider: string | null
          expires_at: string | null
          id: string
          is_wildcard: boolean
          issued_at: string | null
          last_alert_sent_at: string | null
          last_error: string | null
          primary_domain: string
          provider: string
          renewed_at: string | null
          revoked_at: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          alert_before_days?: number
          alternate_names?: string[]
          auto_redirect_http?: boolean
          certificate_chain_diagnostics?: string | null
          certificate_chain_issuer?: string | null
          certificate_chain_valid?: boolean | null
          certificate_status?: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type?: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at?: string
          dns_provider?: string | null
          expires_at?: string | null
          id?: string
          is_wildcard?: boolean
          issued_at?: string | null
          last_alert_sent_at?: string | null
          last_error?: string | null
          primary_domain: string
          provider?: string
          renewed_at?: string | null
          revoked_at?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          alert_before_days?: number
          alternate_names?: string[]
          auto_redirect_http?: boolean
          certificate_chain_diagnostics?: string | null
          certificate_chain_issuer?: string | null
          certificate_chain_valid?: boolean | null
          certificate_status?: Database["public"]["Enums"]["ssl_certificate_status"]
          challenge_type?: Database["public"]["Enums"]["ssl_challenge_type"]
          created_at?: string
          dns_provider?: string | null
          expires_at?: string | null
          id?: string
          is_wildcard?: boolean
          issued_at?: string | null
          last_alert_sent_at?: string | null
          last_error?: string | null
          primary_domain?: string
          provider?: string
          renewed_at?: string | null
          revoked_at?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_ssl_certificates_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_service_deployments: {
        Row: {
          action: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config: string | null
          applied_vhost_config: string | null
          config_id: string
          created_at: string
          created_by: string | null
          id: string
          orchestration_log: string | null
          rollback_source_deployment_id: string | null
          site_id: string
          snapshot_pool_config: string | null
          snapshot_vhost_config: string | null
          status: Database["public"]["Enums"]["service_deployment_status"]
          validation_output: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config?: string | null
          applied_vhost_config?: string | null
          config_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          orchestration_log?: string | null
          rollback_source_deployment_id?: string | null
          site_id: string
          snapshot_pool_config?: string | null
          snapshot_vhost_config?: string | null
          status?: Database["public"]["Enums"]["service_deployment_status"]
          validation_output?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["service_action_type"]
          applied_pool_config?: string | null
          applied_vhost_config?: string | null
          config_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          orchestration_log?: string | null
          rollback_source_deployment_id?: string | null
          site_id?: string
          snapshot_pool_config?: string | null
          snapshot_vhost_config?: string | null
          status?: Database["public"]["Enums"]["service_deployment_status"]
          validation_output?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_service_deployments_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "site_service_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_deployments_rollback_source_deployment_id_fkey"
            columns: ["rollback_source_deployment_id"]
            isOneToOne: false
            referencedRelation: "site_service_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_service_deployments_site_id_fkey"
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
      service_control_runs: {
        Row: {
          action: Database["public"]["Enums"]["service_control_action"]
          config_test_passed: boolean | null
          created_at: string
          id: string
          output: string | null
          requested_by: string | null
          service_id: string
          status: Database["public"]["Enums"]["service_runtime_status"]
        }
        Insert: {
          action: Database["public"]["Enums"]["service_control_action"]
          config_test_passed?: boolean | null
          created_at?: string
          id?: string
          output?: string | null
          requested_by?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["service_runtime_status"]
        }
        Update: {
          action?: Database["public"]["Enums"]["service_control_action"]
          config_test_passed?: boolean | null
          created_at?: string
          id?: string
          output?: string | null
          requested_by?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["service_runtime_status"]
        }
        Relationships: [
          {
            foreignKeyName: "service_control_runs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_journal_entries: {
        Row: {
          id: string
          logged_at: string
          message: string
          service_id: string
          severity: string
          unit: string
        }
        Insert: {
          id?: string
          logged_at?: string
          message: string
          service_id: string
          severity?: string
          unit: string
        }
        Update: {
          id?: string
          logged_at?: string
          message?: string
          service_id?: string
          severity?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_journal_entries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_maintenance_actions: {
        Row: {
          action: Database["public"]["Enums"]["service_control_action"]
          action_name: string
          created_at: string
          cron_expression: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          next_run_at: string | null
          payload: Json
          service_id: string | null
          updated_at: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["service_control_action"]
          action_name: string
          created_at?: string
          cron_expression: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["service_control_action"]
          action_name?: string
          created_at?: string
          cron_expression?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          payload?: Json
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_maintenance_actions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_package_updates: {
        Row: {
          applied_at: string | null
          available_at: string
          current_version: string
          id: string
          package_name: string
          service_id: string
          status: string
          summary: string | null
          target_version: string
        }
        Insert: {
          applied_at?: string | null
          available_at?: string
          current_version: string
          id?: string
          package_name: string
          service_id: string
          status?: string
          summary?: string | null
          target_version: string
        }
        Update: {
          applied_at?: string | null
          available_at?: string
          current_version?: string
          id?: string
          package_name?: string
          service_id?: string
          status?: string
          summary?: string | null
          target_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_package_updates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_reputation_events: {
        Row: {
          action_recommended: string | null
          categories: Json
          checked_at: string
          confidence: number | null
          details: Json
          id: string
          provider_name: string
          reputation_score: number | null
          site_id: string | null
          source_ip: unknown
        }
        Insert: {
          action_recommended?: string | null
          categories?: Json
          checked_at?: string
          confidence?: number | null
          details?: Json
          id?: string
          provider_name: string
          reputation_score?: number | null
          site_id?: string | null
          source_ip: unknown
        }
        Update: {
          action_recommended?: string | null
          categories?: Json
          checked_at?: string
          confidence?: number | null
          details?: Json
          id?: string
          provider_name?: string
          reputation_score?: number | null
          site_id?: string | null
          source_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "ip_reputation_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_scan_findings: {
        Row: {
          confidence: number
          detected_at: string
          detector: string
          file_path: string | null
          id: string
          is_resolved: boolean
          line_number: number | null
          match_preview: string | null
          resolved_at: string | null
          scan_id: string | null
          secret_type: string
          site_id: string | null
          source_kind: string
        }
        Insert: {
          confidence?: number
          detected_at?: string
          detector: string
          file_path?: string | null
          id?: string
          is_resolved?: boolean
          line_number?: number | null
          match_preview?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          secret_type: string
          site_id?: string | null
          source_kind?: string
        }
        Update: {
          confidence?: number
          detected_at?: string
          detector?: string
          file_path?: string | null
          id?: string
          is_resolved?: boolean
          line_number?: number | null
          match_preview?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          secret_type?: string
          site_id?: string | null
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_scan_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "site_security_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_scan_findings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          category: Database["public"]["Enums"]["audit_event_category"]
          created_at: string
          details: Json
          event_hash: string
          id: string
          prev_event_hash: string | null
          site_id: string | null
          source_ip: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          category: Database["public"]["Enums"]["audit_event_category"]
          created_at?: string
          details?: Json
          event_hash?: string
          id?: string
          prev_event_hash?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          category?: Database["public"]["Enums"]["audit_event_category"]
          created_at?: string
          details?: Json
          event_hash?: string
          id?: string
          prev_event_hash?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audit_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_security_scans: {
        Row: {
          findings: Json
          findings_count: number
          id: string
          scanned_at: string
          scan_type: Database["public"]["Enums"]["security_scan_type"]
          scanner_name: string
          severity: string
          site_id: string | null
          status: string
          summary: string | null
          target_path: string | null
        }
        Insert: {
          findings?: Json
          findings_count?: number
          id?: string
          scanned_at?: string
          scan_type: Database["public"]["Enums"]["security_scan_type"]
          scanner_name: string
          severity?: string
          site_id?: string | null
          status?: string
          summary?: string | null
          target_path?: string | null
        }
        Update: {
          findings?: Json
          findings_count?: number
          id?: string
          scanned_at?: string
          scan_type?: Database["public"]["Enums"]["security_scan_type"]
          scanner_name?: string
          severity?: string
          site_id?: string | null
          status?: string
          summary?: string | null
          target_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_security_scans_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ssh_keys: {
        Row: {
          algorithm: string | null
          comment: string | null
          created_at: string
          fingerprint: string | null
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          public_key: string
          revoked_at: string | null
          site_id: string | null
          source_ip: unknown | null
          user_id: string | null
        }
        Insert: {
          algorithm?: string | null
          comment?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          public_key: string
          revoked_at?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Update: {
          algorithm?: string | null
          comment?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          public_key?: string
          revoked_at?: string | null
          site_id?: string | null
          source_ip?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ssh_keys_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ssh_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waf_events: {
        Row: {
          action_taken: string
          country_code: string | null
          details: Json
          detected_at: string
          id: string
          policy_id: string | null
          request_path: string | null
          rule_id: string | null
          severity: string
          site_id: string | null
          source_ip: unknown | null
          threat_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_taken?: string
          country_code?: string | null
          details?: Json
          detected_at?: string
          id?: string
          policy_id?: string | null
          request_path?: string | null
          rule_id?: string | null
          severity?: string
          site_id?: string | null
          source_ip?: unknown | null
          threat_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_taken?: string
          country_code?: string | null
          details?: Json
          detected_at?: string
          id?: string
          policy_id?: string | null
          request_path?: string | null
          rule_id?: string | null
          severity?: string
          site_id?: string | null
          source_ip?: unknown | null
          threat_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waf_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "waf_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waf_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      waf_policies: {
        Row: {
          config: Json
          created_at: string
          engine: string
          id: string
          is_enabled: boolean
          mode: string
          policy_name: string
          ruleset_version: string | null
          site_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          engine?: string
          id?: string
          is_enabled?: boolean
          mode?: string
          policy_name: string
          ruleset_version?: string | null
          site_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          engine?: string
          id?: string
          is_enabled?: boolean
          mode?: string
          policy_name?: string
          ruleset_version?: string | null
          site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waf_policies_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
      system_services: {
        Row: {
          config_test_command: string | null
          dependency_graph: Json
          display_name: string
          id: string
          last_config_test_output: string | null
          last_config_test_passed: boolean | null
          memory_usage_mb: number
          resource_limits: Json
          service_name: string
          site_id: string | null
          status: Database["public"]["Enums"]["service_runtime_status"]
          updated_at: string
          version: string | null
        }
        Insert: {
          config_test_command?: string | null
          dependency_graph?: Json
          display_name: string
          id?: string
          last_config_test_output?: string | null
          last_config_test_passed?: boolean | null
          memory_usage_mb?: number
          resource_limits?: Json
          service_name: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["service_runtime_status"]
          updated_at?: string
          version?: string | null
        }
        Update: {
          config_test_command?: string | null
          dependency_graph?: Json
          display_name?: string
          id?: string
          last_config_test_output?: string | null
          last_config_test_passed?: boolean | null
          memory_usage_mb?: number
          resource_limits?: Json
          service_name?: string
          site_id?: string | null
          status?: Database["public"]["Enums"]["service_runtime_status"]
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_services_site_id_fkey"
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
      app_install_status: "draft" | "installed" | "syncing" | "failed"
      app_role: "super_admin" | "admin" | "user"
      app_template_runtime: "php" | "nodejs" | "python" | "wordpress" | "static"
      audit_event_category: "firewall" | "waf" | "ssh" | "scan" | "auth" | "intel" | "system"
      backup_frequency: "daily" | "weekly" | "monthly"
      backup_verification_status: "pending" | "verified" | "warning" | "failed"
      backup_status: "pending" | "in_progress" | "completed" | "failed"
      backup_type: "full" | "files" | "database" | "scheduled"
      cron_job_status: "success" | "failed" | "running"
      cron_job_type: "backup" | "cleanup" | "maintenance" | "custom"
      db_type: "mysql" | "postgresql" | "mariadb"
      file_operation_status: "queued" | "running" | "completed" | "failed"
      file_operation_type: "extract_archive" | "git_clone" | "git_pull" | "set_permissions" | "fix_ownership" | "publish_archive_site"
      health_status: "healthy" | "warning" | "critical" | "unknown"
      incident_status: "investigating" | "identified" | "monitoring" | "resolved"
      malware_scan_status: "clean" | "warning" | "infected"
      offsite_storage_provider: "s3" | "backblaze_b2" | "wasabi" | "gcs"
      monitoring_alert_severity: "info" | "warning" | "critical"
      monitoring_alert_status: "open" | "acknowledged" | "resolved"
      monitoring_alert_type: "ssl_expiry" | "mail_queue" | "db_slow_query" | "http_health" | "process_health" | "anomaly" | "agent"
      restore_mode: "full" | "files_only" | "database_only" | "partial"
      restore_status: "previewing" | "ready" | "restoring" | "completed" | "failed" | "cancelled"
      security_scan_type: "malware" | "vulnerability" | "secret_scan"
      package_action_type:
        | "composer_install"
        | "npm_install"
        | "pip_install"
        | "composer_update"
        | "npm_build"
        | "pip_freeze"
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
      runtime_environment: "production" | "staging" | "development"
      service_action_type: "provision" | "deploy" | "rollback" | "test"
      service_control_action: "start" | "stop" | "restart" | "config_test" | "package_update" | "maintenance"
      service_runtime_status: "running" | "stopped" | "restarting" | "failed"
      service_deployment_status:
        | "pending"
        | "validated"
        | "deployed"
        | "failed"
        | "rolled_back"
      ssl_certificate_status:
        | "pending"
        | "issued"
        | "renewing"
        | "revoked"
        | "failed"
        | "expiring"
      ssl_challenge_type: "http_01" | "dns_01"
      site_role: "owner" | "admin" | "developer" | "viewer"
      site_status: "active" | "pending" | "suspended" | "error"
      site_type: "wordpress" | "nodejs" | "python" | "php" | "static" | "custom"
      vhost_template_type: "php_fpm" | "reverse_proxy" | "static_site" | "custom"
      web_server_type: "nginx" | "apache"
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
      app_install_status: ["draft", "installed", "syncing", "failed"],
      app_role: ["super_admin", "admin", "user"],
      app_template_runtime: ["php", "nodejs", "python", "wordpress", "static"],
      audit_event_category: ["firewall", "waf", "ssh", "scan", "auth", "intel", "system"],
      backup_frequency: ["daily", "weekly", "monthly"],
      backup_verification_status: ["pending", "verified", "warning", "failed"],
      backup_status: ["pending", "in_progress", "completed", "failed"],
      backup_type: ["full", "files", "database", "scheduled"],
      cron_job_status: ["success", "failed", "running"],
      cron_job_type: ["backup", "cleanup", "maintenance", "custom"],
      db_type: ["mysql", "postgresql", "mariadb"],
      file_operation_status: ["queued", "running", "completed", "failed"],
      file_operation_type: ["extract_archive", "git_clone", "git_pull", "set_permissions", "fix_ownership", "publish_archive_site"],
      health_status: ["healthy", "warning", "critical", "unknown"],
      incident_status: ["investigating", "identified", "monitoring", "resolved"],
      malware_scan_status: ["clean", "warning", "infected"],
      offsite_storage_provider: ["s3", "backblaze_b2", "wasabi", "gcs"],
      monitoring_alert_severity: ["info", "warning", "critical"],
      monitoring_alert_status: ["open", "acknowledged", "resolved"],
      monitoring_alert_type: ["ssl_expiry", "mail_queue", "db_slow_query", "http_health", "process_health", "anomaly", "agent"],
      restore_mode: ["full", "files_only", "database_only", "partial"],
      restore_status: ["previewing", "ready", "restoring", "completed", "failed", "cancelled"],
      security_scan_type: ["malware", "vulnerability", "secret_scan"],
      package_action_type: [
        "composer_install",
        "npm_install",
        "pip_install",
        "composer_update",
        "npm_build",
        "pip_freeze",
      ],
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
      runtime_environment: ["production", "staging", "development"],
      service_action_type: ["provision", "deploy", "rollback", "test"],
      service_control_action: ["start", "stop", "restart", "config_test", "package_update", "maintenance"],
      service_runtime_status: ["running", "stopped", "restarting", "failed"],
      service_deployment_status: [
        "pending",
        "validated",
        "deployed",
        "failed",
        "rolled_back",
      ],
      ssl_certificate_status: [
        "pending",
        "issued",
        "renewing",
        "revoked",
        "failed",
        "expiring",
      ],
      ssl_challenge_type: ["http_01", "dns_01"],
      site_role: ["owner", "admin", "developer", "viewer"],
      site_status: ["active", "pending", "suspended", "error"],
      site_type: ["wordpress", "nodejs", "python", "php", "static", "custom"],
      vhost_template_type: ["php_fpm", "reverse_proxy", "static_site", "custom"],
      web_server_type: ["nginx", "apache"],
    },
  },
} as const
