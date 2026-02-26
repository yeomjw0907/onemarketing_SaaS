/**
 * Vercel Cron — 월/수/목 주간 알림톡 발송
 * 한국 시간 기준: 월 09:30, 수 14:00, 목 16:00 등으로 Cron 설정 권장
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createWeeklyNotification } from "@/lib/notifications/create-weekly-notification";
import {
  notifyMonReview,
  notifyWedBudget,
  notifyThuProposal,
} from "@/lib/notifications/alimtalk";
import {
  getMetricsSnapshotForClient,
  getAiMessageForReport,
} from "@/lib/ai/notification-message";
import type { NotificationReportType } from "@/lib/types/database";

export const runtime = "nodejs";
export const maxDuration = 120;

/** 한국 시간 요일 (0=일, 1=월, ..., 6=토) */
function getKoreaDayOfWeek(): number {
  const kr = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  return kr.getDay();
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = getKoreaDayOfWeek();
  const reportTypeByDay: Record<number, NotificationReportType | null> = {
    1: "MON_REVIEW",
    3: "WED_BUDGET",
    4: "THU_PROPOSAL",
  };
  const reportType = reportTypeByDay[day] ?? null;

  if (!reportType) {
    return NextResponse.json({
      message: "오늘은 발송 요일이 아닙니다.",
      day,
      koreaDay: ["일", "월", "화", "수", "목", "금", "토"][day],
    });
  }

  const supabase = await createServiceClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_phone")
    .eq("is_active", true)
    .not("contact_phone", "is", null)
    .neq("contact_phone", "");

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: "발송 대상 클라이언트 없음" });
  }

  const results: { clientId: string; clientName: string; success: boolean; error?: string }[] = [];

  for (const client of clients) {
    const phone = (client.contact_phone as string).replace(/-/g, "");
    try {
      const snapshot = await getMetricsSnapshotForClient(supabase, client.id, reportType);
      const aiMessage = await getAiMessageForReport(supabase, client.id, reportType, snapshot);

      const created = await createWeeklyNotification(supabase, {
        clientId: client.id,
        reportType,
        metricsSnapshot: snapshot,
        aiMessage,
        withApproval: reportType === "THU_PROPOSAL",
      });

      let sendResult: { success: boolean; error?: string };
      if (reportType === "MON_REVIEW") {
        sendResult = await notifyMonReview({
          phoneNumber: phone,
          clientName: client.name,
          summary: aiMessage ?? "지난주 성과를 확인해 주세요.",
          viewUrl: created.viewUrl,
        });
      } else if (reportType === "WED_BUDGET") {
        sendResult = await notifyWedBudget({
          phoneNumber: phone,
          clientName: client.name,
          summary: aiMessage ?? "예산 소진 현황을 확인해 주세요.",
          viewUrl: created.viewUrl,
        });
      } else {
        sendResult = await notifyThuProposal({
          phoneNumber: phone,
          clientName: client.name,
          summary: aiMessage ?? "다음 주 제안을 확인해 주세요.",
          viewUrl: created.viewUrl,
          approveUrl: created.approveUrl!,
        });
      }

      if (sendResult.success) {
        await supabase.from("notification_logs").insert({
          client_id: client.id,
          notification_type: `alimtalk_weekly_${reportType}`,
          recipient_phone: phone,
          success: true,
          payload: { notification_id: created.id },
        });
      } else {
        await supabase.from("notification_logs").insert({
          client_id: client.id,
          notification_type: `alimtalk_weekly_${reportType}`,
          recipient_phone: phone,
          success: false,
          error_message: sendResult.error ?? undefined,
          payload: { notification_id: created.id },
        });
      }

      results.push({ clientId: client.id, clientName: client.name, success: sendResult.success });
      if (!sendResult.success) {
        results[results.length - 1].error = sendResult.error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        clientId: client.id,
        clientName: client.name,
        success: false,
        error: message,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({
    message: `주간 알림톡 발송 완료: ${successCount}/${results.length}건`,
    reportType,
    results,
  });
}
