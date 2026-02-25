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
  WELCOME: "TPL_welcome",                           // 가입 승인 완료 (웰컴)
  REPORT_PUBLISHED: "TPL_report_published",        // 보고서 발행 알림
  ACTION_STATUS_CHANGED: "TPL_action_status",       // 실행항목 상태 변경 알림
  EVENT_REMINDER: "TPL_event_reminder",             // 일정 리마인더
  PASSWORD_RESET: "TPL_password_reset",             // 비밀번호 리셋 안내
  MON_REVIEW: "TPL_mon_review",                     // 지난주 성과 리뷰
  WED_BUDGET: "TPL_wed_budget",                     // 예산 페이싱
  THU_PROPOSAL: "TPL_thu_proposal",                 // 다음 주 제안 + 승인
  ADDON_ORDER_TO_ADMIN: "TPL_addon_order_admin",    // 부가서비스 주문 접수 (관리자 수신)
  ADDON_ORDER_TO_CLIENT: "TPL_addon_order_client",  // 부가서비스 주문 접수 확인 (고객 수신)
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

// ── 전화번호 정규화 (숫자만, 10~11자리) ──
function normalizePhone(to: string): string {
  const digits = to.replace(/\D/g, "");
  return digits;
}

function isValidPhone(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 11 && /^0[0-9]+$/.test(digits);
}

/** 카카오 템플릿에서 URL 변수는 `https://#{링크}` 형태로 쓰므로, 링크 값은 프로토콜 제외해 보냄 */
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "").trim() || url;
}

// ── 단건 알림톡 발송 ──
export async function sendAlimtalk(message: AlimtalkMessage): Promise<SendResult> {
  const pfId = process.env.SOLAPI_PFID;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

  if (!pfId) {
    return { success: false, error: "SOLAPI_PFID가 설정되지 않았습니다." };
  }

  const phoneDigits = normalizePhone(message.to);
  if (!isValidPhone(phoneDigits)) {
    return { success: false, error: "유효한 수신 전화번호가 아닙니다. (010 등 10~11자리)" };
  }

  if (!message.templateId?.trim()) {
    return { success: false, error: "알림톡 템플릿 ID가 없습니다." };
  }

  try {
    const body = {
      message: {
        to: phoneDigits,
        from: senderNumber || "",
        kakaoOptions: {
          pfId,
          templateId: message.templateId.trim(),
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

    // 솔라피: statusCode "2000" = 정상 접수(성공), 그 외는 오류
    const isSuccess = res.ok && (data.statusCode === "2000" || data.statusCode === 2000 || !data.statusCode);
    if (!isSuccess) {
      return {
        success: false,
        error: data.errorMessage || data.statusMessage || data.message || `HTTP ${res.status}`,
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

// ── 편의 함수: 가입 승인 완료 (웰컴) ──
export async function notifyWelcome(params: {
  phoneNumber: string;
  clientName: string;
  dashboardUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.WELCOME,
    variables: {
      "#{고객명}": params.clientName,
      "#{링크}": stripProtocol(params.dashboardUrl),
    },
  });
}

// ── 편의 함수: 보고서 발행 알림 ──
export async function notifyReportPublished(params: {
  phoneNumber: string;
  clientName: string;
  reportTitle: string;
  reportUrl: string;
  brief?: string;
}): Promise<SendResult> {
  const variables: Record<string, string> = {
    "#{고객명}": params.clientName,
    "#{리포트제목}": params.reportTitle,
    "#{링크}": stripProtocol(params.reportUrl),
  };
  if (params.brief) {
    variables["#{브리프}"] = params.brief;
  }
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.REPORT_PUBLISHED,
    variables,
  });
}

// ── 편의 함수: 액션 상태 변경 알림 (실행 현황 매직링크 포함) ──
export async function notifyActionStatusChanged(params: {
  phoneNumber: string;
  clientName: string;
  actionTitle: string;
  oldStatus: string;
  newStatus: string;
  /** 실행 현황 매직링크 URL (포털 토큰) */
  viewUrl?: string;
}): Promise<SendResult> {
  const statusLabel: Record<string, string> = {
    planned: "계획됨", in_progress: "진행중", done: "완료", hold: "보류",
  };

  const variables: Record<string, string> = {
    "#{고객명}": params.clientName,
    "#{작업명}": params.actionTitle,
    "#{이전상태}": statusLabel[params.oldStatus] || params.oldStatus,
    "#{현재상태}": statusLabel[params.newStatus] || params.newStatus,
  };
  variables["#{링크}"] = params.viewUrl
    ? stripProtocol(params.viewUrl)
    : stripProtocol(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/execution`);

  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.ACTION_STATUS_CHANGED,
    variables,
  });
}

// ── 편의 함수: 일정 리마인더 (타임라인 매직링크 포함) ──
export async function notifyEventReminder(params: {
  phoneNumber: string;
  clientName: string;
  eventTitle: string;
  eventDate: string;
  /** 일정(타임라인) 매직링크 URL (포털 토큰) */
  viewUrl?: string;
}): Promise<SendResult> {
  const variables: Record<string, string> = {
    "#{고객명}": params.clientName,
    "#{일정명}": params.eventTitle,
    "#{날짜}": params.eventDate,
  };
  variables["#{링크}"] = params.viewUrl
    ? stripProtocol(params.viewUrl)
    : stripProtocol(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/timeline`);

  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.EVENT_REMINDER,
    variables,
  });
}

// ── 월/수/목 주간 알림 (자세히 보기 링크 포함) ──
export async function notifyMonReview(params: {
  phoneNumber: string;
  clientName: string;
  summary: string;
  viewUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.MON_REVIEW,
    variables: {
      "#{고객명}": params.clientName,
      "#{요약}": params.summary,
      "#{자세히보기}": stripProtocol(params.viewUrl),
    },
  });
}

export async function notifyWedBudget(params: {
  phoneNumber: string;
  clientName: string;
  summary: string;
  viewUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.WED_BUDGET,
    variables: {
      "#{고객명}": params.clientName,
      "#{요약}": params.summary,
      "#{자세히보기}": stripProtocol(params.viewUrl),
    },
  });
}

export async function notifyThuProposal(params: {
  phoneNumber: string;
  clientName: string;
  summary: string;
  viewUrl: string;
  approveUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.THU_PROPOSAL,
    variables: {
      "#{고객명}": params.clientName,
      "#{요약}": params.summary,
      "#{자세히보기}": stripProtocol(params.viewUrl),
      "#{승인하기}": stripProtocol(params.approveUrl),
    },
  });
}

// ── 부가서비스 주문 접수 알림 (관리자 수신) ──
export async function notifyAddonOrderToAdmin(params: {
  to: string;
  clientName: string;
  addonLabel: string;
  priceWon: number;
  orderId: string;
  adminOrdersUrl?: string;
}): Promise<SendResult> {
  const link = params.adminOrdersUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/addon-orders`;
  return sendAlimtalk({
    to: params.to,
    templateId: TEMPLATE_IDS.ADDON_ORDER_TO_ADMIN,
    variables: {
      "#{고객명}": params.clientName,
      "#{서비스명}": params.addonLabel,
      "#{금액}": `₩${params.priceWon.toLocaleString()}`,
      "#{링크}": stripProtocol(link),
    },
  });
}

// ── 부가서비스 주문 접수 확인 (고객 수신) ──
export async function notifyAddonOrderToClient(params: {
  phoneNumber: string;
  clientName: string;
  addonLabel: string;
  priceWon: number;
  orderDetailUrl?: string;
}): Promise<SendResult> {
  const link = params.orderDetailUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || ""}/overview`;
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.ADDON_ORDER_TO_CLIENT,
    variables: {
      "#{고객명}": params.clientName,
      "#{서비스명}": params.addonLabel,
      "#{금액}": `₩${params.priceWon.toLocaleString()}`,
      "#{링크}": stripProtocol(link),
    },
  });
}
