import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationReportType } from "@/lib/types/database";
import type { Json } from "@/lib/types/database";
import {
  generateSecureToken,
  getViewTokenExpiresAt,
  getApprovalTokenExpiresAt,
  buildViewUrl,
  buildApproveUrl,
} from "./tokens";

export interface CreateWeeklyNotificationParams {
  clientId: string;
  reportType: NotificationReportType;
  metricsSnapshot: Json;
  aiMessage: string | null;
  /** 목요일 제안일 때만 true */
  withApproval?: boolean;
}

export interface CreateWeeklyNotificationResult {
  id: string;
  viewToken: string;
  viewUrl: string;
  approvalToken: string | null;
  approveUrl: string | null;
}

export async function createWeeklyNotification(
  supabase: SupabaseClient,
  params: CreateWeeklyNotificationParams
): Promise<CreateWeeklyNotificationResult> {
  const viewToken = generateSecureToken();
  const viewTokenExpiresAt = getViewTokenExpiresAt().toISOString();

  let approvalToken: string | null = null;
  let approvalTokenExpiresAt: string | null = null;
  let approvalStatus: "PENDING" | null = null;

  if (params.withApproval) {
    approvalToken = generateSecureToken();
    approvalTokenExpiresAt = getApprovalTokenExpiresAt().toISOString();
    approvalStatus = "PENDING";
  }

  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      client_id: params.clientId,
      report_type: params.reportType,
      metrics_snapshot: params.metricsSnapshot,
      ai_message: params.aiMessage,
      view_token: viewToken,
      view_token_expires_at: viewTokenExpiresAt,
      approval_token: approvalToken,
      approval_token_expires_at: approvalTokenExpiresAt,
      approval_status: approvalStatus,
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!row) throw new Error("Notification insert returned no row");

  return {
    id: row.id,
    viewToken,
    viewUrl: buildViewUrl(viewToken),
    approvalToken,
    approveUrl: approvalToken ? buildApproveUrl(approvalToken) : null,
  };
}
