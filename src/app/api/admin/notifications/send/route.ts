/**
 * 관리자 알림 발송 API
 * POST { type, clientId, data }
 *
 * type: "report_published" | "action_status" | "event_reminder" | "custom"
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  notifyReportPublished,
  notifyActionStatusChanged,
  notifyEventReminder,
  sendAlimtalk,
} from "@/lib/notifications/alimtalk";

export async function POST(req: NextRequest) {
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
      case "report_published":
        result = await notifyReportPublished({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          reportTitle: data?.reportTitle || "새 리포트",
          reportUrl: data?.reportUrl || `${process.env.NEXT_PUBLIC_APP_URL}/reports`,
        });
        break;

      case "action_status":
        result = await notifyActionStatusChanged({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          actionTitle: data?.actionTitle || "",
          oldStatus: data?.oldStatus || "",
          newStatus: data?.newStatus || "",
        });
        break;

      case "event_reminder":
        result = await notifyEventReminder({
          phoneNumber: client.contact_phone,
          clientName: client.name,
          eventTitle: data?.eventTitle || "",
          eventDate: data?.eventDate || "",
        });
        break;

      case "custom":
        result = await sendAlimtalk({
          to: client.contact_phone,
          templateId: data?.templateId || "",
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
