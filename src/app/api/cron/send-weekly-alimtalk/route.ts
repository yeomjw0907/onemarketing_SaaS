/**
 * Vercel Cron — 매일 오전 9시(KST) 알림톡 발송
 * client_report_schedules 테이블 기반으로 오늘 요일에 해당하는 스케줄만 처리
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
import { createAutoCalendarEvent } from "@/lib/calendar/create-auto-event";

export const runtime = "nodejs";
export const maxDuration = 120;

/** 한국 시간 요일 (0=일, 1=월, ..., 6=토) */
function getKoreaDayOfWeek(): number {
  const kr = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  return kr.getDay();
}

/** snapshot이 비어 있거나 모든 수치가 0인지 판단 */
function isSnapshotEmpty(snapshot: Record<string, unknown>): boolean {
  const numericKeys = Object.entries(snapshot)
    .filter(([k]) => k !== "period")
    .filter(([, v]) => typeof v === "number");
  if (numericKeys.length === 0) return true;
  return numericKeys.every(([, v]) => (v as number) === 0);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = getKoreaDayOfWeek();
  const supabase = await createServiceClient();

  // client_report_schedules에서 오늘 요일 + 활성 스케줄 조회
  const { data: schedules, error: scheduleError } = await supabase
    .from("client_report_schedules")
    .select("id, client_id, template_type, clients(id, name, contact_phone)")
    .eq("day_of_week", day)
    .eq("is_active", true);

  if (scheduleError) {
    console.error("[Cron] 스케줄 조회 오류:", scheduleError);
    return NextResponse.json({ error: "스케줄 조회 실패", detail: scheduleError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({
      message: "오늘 발송할 스케줄 없음",
      day,
      koreaDay: ["일", "월", "화", "수", "목", "금", "토"][day],
    });
  }

  // template_type → NotificationReportType 매핑
  const templateTypeMap: Record<string, NotificationReportType> = {
    PERFORMANCE: "MON_REVIEW",
    BUDGET: "WED_BUDGET",
    PROPOSAL: "THU_PROPOSAL",
  };

  const results: {
    scheduleId: string;
    clientId: string;
    clientName: string;
    success: boolean;
    skipped?: boolean;
    error?: string;
  }[] = [];

  const calendarTitleMap: Record<string, string> = {
    MON_REVIEW: "📊 주간 성과 리뷰 알림톡 발송",
    WED_BUDGET: "📈 예산 페이싱 알림톡 발송",
    THU_PROPOSAL: "💡 다음주 제안 알림톡 발송",
  };

  for (const schedule of schedules) {
    const client = Array.isArray(schedule.clients)
      ? schedule.clients[0]
      : schedule.clients;

    if (!client || !client.contact_phone) {
      console.warn(`[Cron] 스케줄 ${schedule.id}: 클라이언트 정보 없음`);
      continue;
    }

    const reportType = templateTypeMap[schedule.template_type] ?? null;
    if (!reportType) {
      console.warn(`[Cron] 스케줄 ${schedule.id}: 알 수 없는 template_type=${schedule.template_type}`);
      continue;
    }

    const phone = (client.contact_phone as string).replace(/-/g, "");

    try {
      const snapshot = await getMetricsSnapshotForClient(supabase, client.id, reportType);

      // 빈 데이터 체크: 모든 수치가 0이면 스킵
      if (isSnapshotEmpty(snapshot)) {
        console.log(`[Cron] 스케줄 ${schedule.id} (${client.name}): 데이터 없음 — 스킵`);
        results.push({
          scheduleId: schedule.id,
          clientId: client.id,
          clientName: client.name,
          success: false,
          skipped: true,
        });
        continue;
      }

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
          payload: { notification_id: created.id, schedule_id: schedule.id },
        });

        // 클라이언트 캘린더에 알림톡 발송 이벤트 자동 기록
        await createAutoCalendarEvent(supabase, {
          clientId: client.id,
          title: calendarTitleMap[reportType] ?? `알림톡 발송: ${reportType}`,
          description: aiMessage ?? undefined,
          eventType: "notification",
        });
      } else {
        await supabase.from("notification_logs").insert({
          client_id: client.id,
          notification_type: `alimtalk_weekly_${reportType}`,
          recipient_phone: phone,
          success: false,
          error_message: sendResult.error ?? undefined,
          payload: { notification_id: created.id, schedule_id: schedule.id },
        });
      }

      results.push({
        scheduleId: schedule.id,
        clientId: client.id,
        clientName: client.name,
        success: sendResult.success,
        ...(sendResult.success ? {} : { error: sendResult.error }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[Cron] 스케줄 ${schedule.id} (${client.name}) 오류:`, message);
      results.push({
        scheduleId: schedule.id,
        clientId: client.id,
        clientName: client.name,
        success: false,
        error: message,
      });
    }
  }

  // 실패 건 관리자 알림
  const failures = results.filter((r) => !r.success && !r.skipped);
  if (failures.length > 0) {
    const adminPhone = process.env.ADMIN_NOTIFY_PHONE;
    if (adminPhone) {
      try {
        await notifyMonReview({
          phoneNumber: adminPhone,
          clientName: "관리자",
          summary: `알림톡 발송 실패 ${failures.length}건: ${failures.map((f) => f.clientName).join(", ")}`,
          viewUrl: "",
        });
      } catch (adminErr) {
        console.error("[Cron] 관리자 알림 발송 실패:", adminErr);
      }
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const skippedCount = results.filter((r) => r.skipped).length;

  return NextResponse.json({
    message: `알림톡 발송 완료: ${successCount}/${results.length}건 (스킵: ${skippedCount}건)`,
    day,
    koreaDay: ["일", "월", "화", "수", "목", "금", "토"][day],
    results,
  });
}
