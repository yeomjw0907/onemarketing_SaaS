import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 연락처(휴대폰)를 하이픈 포맷으로 표시 (010-1234-5678)
 * 숫자만 추출 후 11자리(010 시작)면 010-XXXX-XXXX로 포맷
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.startsWith("010") && digits.length >= 4) {
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 입력 중 연락처 포맷팅: 숫자만 허용, 최대 11자리, 010-XXXX-XXXX 형태로 표시
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.startsWith("010") && digits.length >= 4) {
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 연락처에서 숫자만 반환 (저장/API 전송용) */
export function phoneToDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(0, 11);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 고객 포털에서 표시할 리포트 제목 (내부용 [AI] 접두어 제거) */
export function clientReportTitle(title: string | null | undefined): string {
  if (!title) return "";
  return title.replace(/^\[AI\]\s*/i, "").trim() || title;
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 반환 (표시용).
 * 리치 텍스트 복사 시 붙는 <p>, <br> 등이 그대로 보이는 현상 방지.
 * 블록/줄바꿈 태그는 줄바꿈으로 치환 후 나머지 태그 제거.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Supabase Storage에 안전한 파일 경로 생성
 * 한글/특수문자를 제거하고 타임스탬프로 유니크 보장
 */
export function safeFilePath(clientId: string, fileName: string): string {
  const ext = fileName.split(".").pop() || "bin";
  // 한글/특수문자 → ASCII only, 공백 → 하이픈
  const base = fileName
    .replace(/\.[^.]+$/, "")          // 확장자 제거
    .replace(/[^\w\s-]/g, "")         // 비 영문/숫자/언더스코어/공백/하이픈 제거
    .replace(/\s+/g, "-")             // 공백 → 하이픈
    .replace(/-+/g, "-")              // 연속 하이픈 정리
    .slice(0, 40)                     // 길이 제한
    || "file";                        // 모든 문자가 제거된 경우 기본값
  return `${clientId}/${Date.now()}_${base}.${ext}`;
}
