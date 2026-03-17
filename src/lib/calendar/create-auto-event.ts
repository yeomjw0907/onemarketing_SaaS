import type { SupabaseClient } from "@supabase/supabase-js";

export interface AutoCalendarEventParams {
  clientId: string;
  title: string;
  description?: string;
  eventType: "report" | "notification";
  /** ISO datetime 문자열. 생략 시 현재 시각(now())으로 설정 */
  occurredAt?: string;
}

/**
 * 서버 측에서 자동으로 캘린더 이벤트를 생성하는 유틸리티.
 * 리포트 발송·알림톡 발송 시 클라이언트 캘린더에 자동 기록합니다.
 * 실패해도 에러를 throw하지 않아 메인 플로우를 막지 않습니다.
 */
export async function createAutoCalendarEvent(
  supabase: SupabaseClient,
  params: AutoCalendarEventParams
): Promise<void> {
  const { clientId, title, description, eventType, occurredAt } = params;
  const now = occurredAt ?? new Date().toISOString();

  try {
    await supabase.from("calendar_events").insert({
      client_id: clientId,
      title,
      description: description ?? null,
      event_type: eventType,
      status: "done",
      visibility: "visible",
      start_at: now,
      end_at: null,
      related_action_ids: [],
    });
  } catch {
    // 캘린더 이벤트 생성 실패는 무시 (알림 발송 자체를 막지 않음)
  }
}
