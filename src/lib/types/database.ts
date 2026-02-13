export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "client";
export type PeriodType = "weekly" | "monthly";
export type ActionStatus = "planned" | "in_progress" | "done" | "hold";
export type ProjectType = "website" | "landing" | "promotion";
export type ProjectStage = "planning" | "design" | "dev" | "qa" | "done";
export type EventStatus = "planned" | "done" | "hold";
export type ReportType = "weekly" | "monthly";
export type AssetType = "logo" | "guideline" | "font" | "photo" | "video" | "other";
export type Visibility = "visible" | "hidden";

export interface EnabledModules {
  overview: boolean;
  execution: boolean;
  calendar: boolean;
  projects: boolean;
  reports: boolean;
  assets: boolean;
  support: boolean;
}

export interface ValidationRule {
  integer?: boolean;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface Client {
  id: string;
  name: string;
  client_code: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  logo_url: string | null;
  kakao_chat_url: string | null;
  enabled_modules: EnabledModules;
  enabled_services: Record<string, boolean>;
  /** 서비스 키별 바로가기 URL (관리자 설정) */
  service_urls?: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  role: UserRole;
  client_id: string | null;
  display_name: string;
  email: string;
  must_change_password: boolean;
  created_at: string;
}

export interface KpiDefinition {
  id: string;
  client_id: string;
  metric_key: string;
  metric_label: string;
  unit: string;
  show_on_overview: boolean;
  overview_order: number;
  chart_enabled: boolean;
  description: string | null;
  validation_rule: ValidationRule | null;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  client_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  metric_key: string;
  value: number;
  notes: string | null;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  client_id: string;
  category: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  action_date: string;
  end_date: string | null;
  links: Json;
  attachments: Json;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  project_type: ProjectType;
  title: string;
  stage: ProjectStage;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  memo: string | null;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  event_type: string;
  status: EventStatus;
  visibility: Visibility;
  related_action_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  report_type: ReportType;
  title: string;
  summary: string | null;
  file_path: string;
  published_at: string;
  visibility: Visibility;
  created_by: string;
  created_at: string;
}

export interface Asset {
  id: string;
  client_id: string;
  asset_type: AssetType;
  title: string;
  file_path: string;
  tags: string[];
  visibility: Visibility;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  client_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  diff: Json;
  created_at: string;
}

// ── 외부 데이터 연동 (META, GA, 네이버 등) ──
export type IntegrationPlatform = "meta_ads" | "google_analytics" | "google_ads" | "naver_ads" | "naver_searchad";
export type IntegrationStatus = "active" | "inactive" | "error";

export interface DataIntegration {
  id: string;
  client_id: string;
  platform: IntegrationPlatform;
  display_name: string;
  credentials: Json;
  config: Json;
  status: IntegrationStatus;
  last_synced_at: string | null;
  error_message: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  client_id: string;
  platform: string;
  sync_type: "full" | "incremental";
  status: "running" | "success" | "error";
  records_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface PlatformMetric {
  id: string;
  client_id: string;
  integration_id: string;
  platform: string;
  metric_date: string;
  metric_key: string;
  metric_value: number;
  dimensions: Json;
  raw_data: Json;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  client_id: string | null;
  notification_type: string;
  recipient_phone: string | null;
  success: boolean;
  message_id: string | null;
  error_message: string | null;
  payload: Json;
  created_at: string;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Client, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "created_at">>;
      };
      kpi_definitions: {
        Row: KpiDefinition;
        Insert: Omit<KpiDefinition, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<KpiDefinition, "id" | "created_at" | "updated_at">>;
      };
      metrics: {
        Row: Metric;
        Insert: Omit<Metric, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Metric, "id" | "created_at" | "updated_at">>;
      };
      actions: {
        Row: Action;
        Insert: Omit<Action, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Action, "id" | "created_at" | "updated_at">>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at" | "updated_at">>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CalendarEvent, "id" | "created_at" | "updated_at">>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, "id" | "created_at">;
        Update: Partial<Omit<Asset, "id" | "created_at">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: never;
      };
      data_integrations: {
        Row: DataIntegration;
        Insert: Omit<DataIntegration, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DataIntegration, "id" | "created_at" | "updated_at">>;
      };
      integration_sync_logs: {
        Row: IntegrationSyncLog;
        Insert: Omit<IntegrationSyncLog, "id">;
        Update: Partial<Omit<IntegrationSyncLog, "id">>;
      };
      platform_metrics: {
        Row: PlatformMetric;
        Insert: Omit<PlatformMetric, "id" | "created_at">;
        Update: Partial<Omit<PlatformMetric, "id" | "created_at">>;
      };
      notification_logs: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, "id" | "created_at">;
        Update: never;
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_client_id: { Args: Record<string, never>; Returns: string | null };
    };
  };
}
