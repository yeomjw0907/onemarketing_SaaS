/**
 * 카카오 알림톡 발송 모듈
 *
 * 솔라피(Solapi) API를 사용합니다.
 * 다른 ISP(NHN Cloud, 비즈뿌리오 등)로 교체할 수 있도록 인터페이스를 분리했습니다.
 *
 * 필요 환경변수:
 *   SOLAPI_API_KEY        - 솔라피 API Key
 *   SOLAPI_API_SECRET     - 솔라피 API Secret
 *   SOLAPI_PFID           - 카카오톡 채널 프로필 ID (예: @onecation)
 *   SOLAPI_SENDER_NUMBER  - 발신번호 (알림톡 실패 시 SMS 대체 발송용)
 */
import crypto from "crypto";

const SOLAPI_BASE = "https://api.solapi.com";

// ── 인터페이스 ──

export interface AlimtalkMessage {
  to: string;              // 수신 전화번호 (01012345678 형식)
  templateId: string;      // 등록된 알림톡 템플릿 ID
  variables: Record<string, string>;  // 템플릿 치환 변수
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── 템플릿 ID 상수 ──
export const TEMPLATE_IDS = {
  REPORT_PUBLISHED: "TPL_report_published",        // 보고서 발행 알림
  ACTION_STATUS_CHANGED: "TPL_action_status",       // 실행항목 상태 변경 알림
  EVENT_REMINDER: "TPL_event_reminder",             // 일정 리마인더
  PASSWORD_RESET: "TPL_password_reset",             // 비밀번호 리셋 안내
} as const;

// ── 솔라피 인증 헤더 생성 ──
function getSolapiAuthHeader(): string {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다.");
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// ── 단건 알림톡 발송 ──
export async function sendAlimtalk(message: AlimtalkMessage): Promise<SendResult> {
  const pfId = process.env.SOLAPI_PFID;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

  if (!pfId) {
    return { success: false, error: "SOLAPI_PFID가 설정되지 않았습니다." };
  }

  try {
    const body = {
      message: {
        to: message.to.replace(/-/g, ""),
        from: senderNumber || "",
        kakaoOptions: {
          pfId,
          templateId: message.templateId,
          variables: message.variables,
        },
      },
    };

    const res = await fetch(`${SOLAPI_BASE}/messages/v4/send`, {
      method: "POST",
      headers: {
        Authorization: getSolapiAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.statusCode) {
      return {
        success: false,
        error: data.errorMessage || data.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: data.groupId || data.messageId,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── 다건 알림톡 발송 ──
export async function sendAlimtalkBulk(messages: AlimtalkMessage[]): Promise<SendResult[]> {
  const results: SendResult[] = [];
  // 순차 발송 (솔라피는 bulk API도 있으나 단건으로 시작)
  for (const msg of messages) {
    const result = await sendAlimtalk(msg);
    results.push(result);
    // Rate limit 방지
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}

// ── 편의 함수: 보고서 발행 알림 ──
export async function notifyReportPublished(params: {
  phoneNumber: string;
  clientName: string;
  reportTitle: string;
  reportUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.REPORT_PUBLISHED,
    variables: {
      "#{고객명}": params.clientName,
      "#{리포트제목}": params.reportTitle,
      "#{링크}": params.reportUrl,
    },
  });
}

// ── 편의 함수: 액션 상태 변경 알림 ──
export async function notifyActionStatusChanged(params: {
  phoneNumber: string;
  clientName: string;
  actionTitle: string;
  oldStatus: string;
  newStatus: string;
}): Promise<SendResult> {
  const statusLabel: Record<string, string> = {
    planned: "계획됨", in_progress: "진행중", done: "완료", hold: "보류",
  };

  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.ACTION_STATUS_CHANGED,
    variables: {
      "#{고객명}": params.clientName,
      "#{작업명}": params.actionTitle,
      "#{이전상태}": statusLabel[params.oldStatus] || params.oldStatus,
      "#{현재상태}": statusLabel[params.newStatus] || params.newStatus,
    },
  });
}

// ── 편의 함수: 일정 리마인더 ──
export async function notifyEventReminder(params: {
  phoneNumber: string;
  clientName: string;
  eventTitle: string;
  eventDate: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.EVENT_REMINDER,
    variables: {
      "#{고객명}": params.clientName,
      "#{일정명}": params.eventTitle,
      "#{날짜}": params.eventDate,
    },
  });
}
