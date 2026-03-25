/**
 * 관리자 알림 발송 API
 * POST { type, clientId, data }
 *
 * type: "report_published" | "action_status" | "event_reminder" | "custom"
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  notifyReportPublished,
  notifyActionStatusChanged,
  notifyEventReminder,
  sendAlimtalk,
} from "@/lib/notifications/alimtalk";
import { getReportBrief } from "@/lib/ai/notification-message";
import {
  generateSecureToken,
  getViewTokenExpiresAt,
  buildViewUrl,
} from "@/lib/notifications/tokens";
import { createPortalToken } from "@/lib/notifications/create-portal-token";
import { createAutoCalendarEvent } from "@/lib/calendar/create-auto-event";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.profile.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await req.json();
  const { type, clientId, data } = body;

  if (!type || !clientId) {
    return NextResponse.json({ error: "type, clientId 필수" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 클라이언트 정보 + 전화번호 가져오기
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, contact_phone, contact_name")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "클라이언트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!client.contact_phone) {
    return NextResponse.json(
      { error: "클라이언트 담당자 전화번호가 등록되지 않았습니다." },
      { status: 400 },
    );
  }

  try {
    let result;

    switch (type) {
      case "report_published": {
        const reportTitle = data?.reportTitle || "새 리포트";
        const reportSummary = data?.reportSummary || null;
        const reportId = data?.reportId as string | undefined;

        let reportUrl = data?.reportUrl || `${process.env.NEXT_PUBLIC_APP_URL}/reports`;
        let brief: string | undefined;

        if (reportId) {
          const viewToken = generateSecureToken();
          const expiresAt = getViewTokenExpiresAt().toISOString();

          await supabase
            .from("reports")
            .update({ view_token: viewToken, view_token_expires_at: expiresAt })
            .eq("id", reportId);

          reportUrl = buildViewUrl(viewToken);
        }

        try {
          brief = await getReportBrief(reportTitle, reportSummary);
        } catch {
          brief = (reportSummary || reportTitle).slice(0, 50);
        }

        result = await notifyReportPublished({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          reportTitle,
          reportUrl,
          brief,
        });

        // 발송 성공 시 클라이언트 캘린더에 자동 이벤트 기록
        if (result.success) {
          await createAutoCalendarEvent(supabase, {
            clientId,
            title: `📊 리포트 발송: ${reportTitle}`,
            description: brief || reportSummary || undefined,
            eventType: "report",
          });
        }
        break;
      }

      case "action_status": {
        const { url: viewUrl } = await createPortalToken(supabase, clientId, "execution");
        result = await notifyActionStatusChanged({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          actionTitle: data?.actionTitle || "",
          oldStatus: data?.oldStatus || "",
          newStatus: data?.newStatus || "",
          viewUrl,
        });
        break;
      }

      case "event_reminder": {
        const { url: viewUrl } = await createPortalToken(supabase, clientId, "timeline");
        result = await notifyEventReminder({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          eventTitle: data?.eventTitle || "",
          eventDate: data?.eventDate || "",
          viewUrl,
        });
        break;
      }

      case "custom":
        if (!data?.templateId?.trim()) {
          return NextResponse.json(
            { error: "custom 타입은 templateId가 필요합니다." },
            { status: 400 },
          );
        }
        result = await sendAlimtalk({
          to: client.contact_phone,
          templateId: data.templateId.trim(),
          variables: data?.variables || {},
        });
        break;

      default:
        return NextResponse.json({ error: `알 수 없는 타입: ${type}` }, { status: 400 });
    }

    // 발송 로그 기록 (notification_logs 테이블)
    try {
      await supabase.from("notification_logs").insert({
        client_id: clientId,
        notification_type: `alimtalk_${type}`,
        recipient_phone: client.contact_phone,
        success: result.success,
        message_id: result.messageId || null,
        error_message: result.error || null,
        payload: data || {},
      });
    } catch {
      // 로그 실패는 무시
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
