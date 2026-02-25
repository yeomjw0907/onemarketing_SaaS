export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "client" | "pending" | "rejected";
export type PeriodType = "weekly" | "monthly";
export type ActionStatus = "planned" | "in_progress" | "done" | "hold";
export type ProjectType = "website" | "landing" | "promotion";
export type ProjectStage = "planning" | "design" | "dev" | "qa" | "done";
export type EventStatus = "planned" | "done" | "hold";
export type ReportType = "weekly" | "monthly";
export type AssetType = "logo" | "guideline" | "font" | "photo" | "video" | "other";
export type Visibility = "visible" | "hidden";
export type AddonOrderStatus = "pending" | "confirmed" | "done" | "cancelled";

export interface EnabledModules {
  overview: boolean;
  execution: boolean;
  calendar: boolean;
  projects: boolean;
  reports: boolean;
  assets: boolean;
  support: boolean;
  timeline: boolean;
}

export interface ValidationRule {
  integer?: boolean;
  min?: number;
  max?: number;
  required?: boolean;
}

/** 실행 현황 카테고리별 목표 (진척도 표시용) */
export interface ExecutionTargetEntry {
  period: "monthly" | "weekly";
  target: number;
}

export type ExecutionTargets = Record<string, ExecutionTargetEntry>;

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
  /** 카테고리별 기간당 목표 건수 (진척도용). 예: { "landing_page": { period: "monthly", target: 25 } } */
  execution_targets?: ExecutionTargets;
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
  company_name: string | null;
  phone: string | null;
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
  project_id: string | null;
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
  project_id: string | null;
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
  view_token: string | null;
  view_token_expires_at: string | null;
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

export interface AddonOrder {
  id: string;
  client_id: string;
  addon_key: string;
  addon_label: string;
  price_won: number;
  status: AddonOrderStatus;
  memo: string | null;
  admin_notes: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
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

/** 알림톡 발송 건 (월/수/목). 보기/승인 토큰 포함 */
export type NotificationReportType = "MON_REVIEW" | "WED_BUDGET" | "THU_PROPOSAL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export interface Notification {
  id: string;
  client_id: string;
  report_type: NotificationReportType;
  metrics_snapshot: Json;
  ai_message: string | null;
  view_token: string;
  view_token_expires_at: string;
  approval_token: string | null;
  approval_token_expires_at: string | null;
  approval_used_at: string | null;
  approval_status: ApprovalStatus;
  sent_at: string;
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
      addon_orders: {
        Row: AddonOrder;
        Insert: Omit<AddonOrder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AddonOrder, "id" | "client_id" | "addon_key" | "addon_label" | "price_won" | "created_at" | "created_by">>;
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      current_client_id: { Args: Record<string, never>; Returns: string | null };
    };
  };
}
