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
  WELCOME:               "KA01TP260225105532366xlkulfkNmAK",  // 가입 승인 완료 (웰컴)
  REPORT_PUBLISHED:      "KA01TP260225105907622RIoYoUiEPHl",  // 보고서 발행 알림
  ACTION_STATUS_CHANGED: "KA01TP260225112210684DBj9B1z2uvu",  // 실행항목 상태 변경 알림
  EVENT_REMINDER:        "KA01TP260225112500730UNG6lezLClc",  // 일정 리마인더
  PASSWORD_RESET:        "KA01TP26022511262520344usp5kCNr9",  // 비밀번호 리셋 안내
  MON_REVIEW:            "KA01TP2602251129061296sowYRA1gYu",  // 지난주 성과 리뷰
  WED_BUDGET:            "KA01TP260225113014090K4FKc6f9nxV",  // 예산 페이싱
  THU_PROPOSAL:          "KA01TP260225113134146BPhdrOnfBkj",  // 다음 주 제안 + 승인
  ADDON_ORDER_TO_ADMIN:  "KA01TP260225113249444j3M42ZwNv6P",  // 부가서비스 주문 접수 (관리자 수신)
  ADDON_ORDER_TO_CLIENT: "KA01TP260225113401454pEZwWwwypBJ",  // 부가서비스 주문 접수 확인 (고객 수신)
  REPORT_FEEDBACK:       "",  // TODO: Solapi 미등록 — 등록 후 ID 입력
  SUBSCRIPTION_EXPIRY:   "",  // TODO: Solapi 미등록 — 등록 후 ID 입력
  CLIENT_INVITE:         "",  // TODO: Solapi 미등록 — 등록 후 ID 입력
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
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
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

// ── 편의 함수: 리포트 피드백 알림 (관리자 수신) ──
export async function notifyReportFeedback(params: {
  to: string;
  clientName: string;
  reportTitle: string;
  reaction: "approved" | "rejected" | null;
  body: string;
  reportUrl?: string;
}): Promise<SendResult> {
  const reactionLabel =
    params.reaction === "approved" ? "승인" :
    params.reaction === "rejected" ? "반려" : "의견";
  const link = params.reportUrl
    ? stripProtocol(params.reportUrl)
    : stripProtocol(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/reports`);

  return sendAlimtalk({
    to: params.to,
    templateId: TEMPLATE_IDS.REPORT_FEEDBACK,
    variables: {
      "#{고객명}": params.clientName,
      "#{리포트제목}": params.reportTitle,
      "#{반응}": reactionLabel,
      "#{내용}": params.body.slice(0, 100),
      "#{링크}": link,
    },
  });
}

// ── 편의 함수: 구독 만료 임박 알림 (에이전시 오너 수신) ──
export async function notifySubscriptionExpiry(params: {
  phoneNumber: string;
  agencyName: string;
  expiryDate: string;   // "2026년 3월 20일" 형식
  daysLeft: number;
  billingUrl?: string;
}): Promise<SendResult> {
  const link = params.billingUrl
    ? stripProtocol(params.billingUrl)
    : stripProtocol(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/billing`);

  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.SUBSCRIPTION_EXPIRY,
    variables: {
      "#{에이전시명}": params.agencyName,
      "#{만료일}": params.expiryDate,
      "#{잔여일수}": String(params.daysLeft),
      "#{링크}": link,
    },
  });
}

// ── 편의 함수: 포털 초대 링크 안내 (클라이언트 수신) ──
export async function notifyClientInvite(params: {
  phoneNumber: string;
  clientName: string;
  inviteUrl: string;
}): Promise<SendResult> {
  return sendAlimtalk({
    to: params.phoneNumber,
    templateId: TEMPLATE_IDS.CLIENT_INVITE,
    variables: {
      "#{고객명}": params.clientName,
      "#{링크}": stripProtocol(params.inviteUrl),
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
