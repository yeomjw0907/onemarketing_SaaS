/**
 * 클라이언트 헬스 스코어 계산
 *
 * 5가지 기준, 100점 만점:
 *  - 리포트 발행:       25pts
 *  - 알림톡 발송:       20pts
 *  - 실행 항목 완료율:  20pts
 *  - 데이터 연동 상태:  20pts (연동 없으면 N/A → 나머지 4개를 100으로 스케일)
 *  - 클라이언트 접속:   15pts
 */

export interface HealthScoreInput {
  /** 가장 최근 리포트 발행일 (published_at) */
  lastReportDate: string | null;
  /** 가장 최근 알림톡 발송 성공일 (notification_logs.created_at, success=true) */
  lastAlimtalkDate: string | null;
  /** 이번 달 실행 항목: 전체 / 완료 */
  executionThisMonth: { total: number; done: number };
  /**
   * 데이터 연동 여부.
   * - null  : 연동 자체가 없음 (N/A → 나머지 4항목을 100pt 기준으로 스케일)
   * - true  : 활성 연동 있음
   * - false : 연동은 있지만 모두 비활성
   */
  hasIntegration: boolean | null;
  /** 클라이언트 사용자 중 가장 최근 로그인일 (auth.users.last_sign_in_at) */
  lastClientLogin: string | null;
}

export interface HealthScoreDetails {
  report: number;
  alimtalk: number;
  execution: number;
  integration: number | null; // null = N/A
  clientLogin: number;
}

export type HealthGrade = "excellent" | "good" | "warning" | "danger";

export interface HealthScoreResult {
  score: number;       // 0–100
  grade: HealthGrade;
  noIntegration: boolean;
  details: HealthScoreDetails;
}

function daysSince(dateStr: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86_400_000);
}

export function calcHealthScore(input: HealthScoreInput): HealthScoreResult {
  const now = new Date();

  // ── 리포트 발행: 25pts ──
  const reportPts = (() => {
    if (!input.lastReportDate) return 0;
    const d = daysSince(input.lastReportDate, now);
    if (d <= 14) return 25;
    if (d <= 30) return 15;
    if (d <= 60) return 5;
    return 0;
  })();

  // ── 알림톡 발송: 20pts ──
  const alimtalkPts = (() => {
    if (!input.lastAlimtalkDate) return 0;
    const d = daysSince(input.lastAlimtalkDate, now);
    if (d <= 7)  return 20;
    if (d <= 14) return 10;
    return 0;
  })();

  // ── 실행 항목 완료율: 20pts ──
  const executionPts = (() => {
    const { total, done } = input.executionThisMonth;
    if (total === 0) return 10; // 이번 달 항목 없음 → 중립
    return Math.round((done / total) * 20);
  })();

  // ── 데이터 연동: 20pts or null (N/A) ──
  const integrationPts: number | null =
    input.hasIntegration === null ? null : input.hasIntegration ? 20 : 0;

  // ── 클라이언트 접속: 15pts ──
  const loginPts = (() => {
    if (!input.lastClientLogin) return 0;
    const d = daysSince(input.lastClientLogin, now);
    if (d <= 7)  return 15;
    if (d <= 30) return 8;
    return 0;
  })();

  const noIntegration = integrationPts === null;

  // ── 최종 점수 ──
  let score: number;
  if (noIntegration) {
    // 나머지 4항목 합계(최대 80) → 100 스케일
    const raw = reportPts + alimtalkPts + executionPts + loginPts;
    score = Math.round(raw * (100 / 80));
  } else {
    score = reportPts + alimtalkPts + executionPts + integrationPts + loginPts;
  }

  score = Math.min(100, Math.max(0, score));

  const grade: HealthGrade =
    score >= 80 ? "excellent" :
    score >= 60 ? "good" :
    score >= 40 ? "warning" : "danger";

  return {
    score,
    grade,
    noIntegration,
    details: {
      report: reportPts,
      alimtalk: alimtalkPts,
      execution: executionPts,
      integration: integrationPts,
      clientLogin: loginPts,
    },
  };
}

/** 등급별 UI 메타 */
export const GRADE_META: Record<HealthGrade, { label: string; color: string; bg: string; dot: string }> = {
  excellent: { label: "우수",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",  dot: "bg-emerald-500" },
  good:      { label: "보통",  color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200",   dot: "bg-yellow-500" },
  warning:   { label: "주의",  color: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   dot: "bg-orange-500" },
  danger:    { label: "위험",  color: "text-red-700",     bg: "bg-red-50 border-red-200",         dot: "bg-red-500" },
};
