import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
