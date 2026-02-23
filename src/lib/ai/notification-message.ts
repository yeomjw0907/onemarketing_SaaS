/**
 * 월/수/목 알림톡용 메트릭 스냅샷 및 AI 요약 문구 생성
 * - 숫자는 코드로 계산, AI는 문장만 생성 (할루시네이션 방지)
 * - 목요일 제안은 안전 장치 적용 (예산 20% 이내, 무리한 증액 금지)
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMetricSummary } from "./report-generator";
import type { NotificationReportType } from "@/lib/types/database";

const MODEL_NAME = "gemini-1.5-flash";

/** 지난주(월~일) 날짜 구간 */
function getLastWeekRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 7 : day;
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - diff);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);
  return {
    dateFrom: lastMonday.toISOString().slice(0, 10),
    dateTo: lastSunday.toISOString().slice(0, 10),
  };
}

/** 이번 달 1일~오늘 구간 */
function getThisMonthToDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dateFrom = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const dateTo = now.toISOString().slice(0, 10);
  return { dateFrom, dateTo };
}

/** 이번 달 말일까지 남은 일수 */
function getDaysRemainingInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = last.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export async function getMetricsSnapshotForClient(
  supabase: SupabaseClient,
  clientId: string,
  reportType: NotificationReportType
): Promise<Record<string, unknown>> {
  if (reportType === "MON_REVIEW") {
    const { dateFrom, dateTo } = getLastWeekRange();
    const summaries = await getMetricSummary(supabase, clientId, dateFrom, dateTo);
    let totalCost = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    for (const s of summaries) {
      const cost = (s.metrics as Record<string, { total: number }>).cost ?? (s.metrics as Record<string, { total: number }>).spend;
      const clicks = (s.metrics as Record<string, { total: number }>).clicks;
      const conversions = (s.metrics as Record<string, { total: number }>).conversions;
      if (cost) totalCost += cost.total;
      if (clicks) totalClicks += clicks.total;
      if (conversions) totalConversions += conversions.total;
    }
    return {
      roas: 0,
      spend: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      period: `${dateFrom} ~ ${dateTo}`,
    };
  }

  if (reportType === "WED_BUDGET") {
    const { dateFrom, dateTo } = getThisMonthToDateRange();
    const summaries = await getMetricSummary(supabase, clientId, dateFrom, dateTo);
    let totalSpend = 0;
    for (const s of summaries) {
      const cost = (s.metrics as Record<string, { total: number }>).cost ?? (s.metrics as Record<string, { total: number }>).spend;
      if (cost) totalSpend += cost.total;
    }
    const daysRemaining = getDaysRemainingInMonth();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return {
      spendThisMonth: Math.round(totalSpend),
      daysRemaining,
      daysInMonth,
    };
  }

  if (reportType === "THU_PROPOSAL") {
    const { dateFrom, dateTo } = getLastWeekRange();
    const summaries = await getMetricSummary(supabase, clientId, dateFrom, dateTo);
    let totalCost = 0;
    let totalConversions = 0;
    for (const s of summaries) {
      const cost = (s.metrics as Record<string, { total: number }>).cost ?? (s.metrics as Record<string, { total: number }>).spend;
      const conversions = (s.metrics as Record<string, { total: number }>).conversions;
      if (cost) totalCost += cost.total;
      if (conversions) totalConversions += conversions.total;
    }
    return {
      lastWeekSpend: Math.round(totalCost),
      lastWeekConversions: totalConversions,
      proposal: "소재 유지 또는 소폭 최적화",
    };
  }

  return {};
}

export async function getAiMessageForReport(
  supabase: SupabaseClient,
  clientId: string,
  reportType: NotificationReportType,
  snapshot: Record<string, unknown>
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackMessage(reportType);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const dataText = JSON.stringify(snapshot, null, 0);

  if (reportType === "MON_REVIEW") {
    const prompt = `역할: 긍정적인 마케팅 분석가.
아래는 지난주 마케팅 성과 데이터(코드로 계산된 수치)입니다. 이 데이터를 바탕으로 50자 이내로 칭찬·격려하는 한 줄 요약을 작성해 주세요. 이모지 1개 포함 가능.
수치를 임의로 바꾸지 마세요. 데이터가 비어 있으면 "지난주 성과를 확인해 주세요."로 답하세요.

데이터: ${dataText}

한 줄 요약:`;
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? getFallbackMessage(reportType);
  }

  if (reportType === "WED_BUDGET") {
    const prompt = `역할: 냉철한 예산 관리자.
아래는 현재 월 예산 소진 관련 데이터입니다. 감정을 배제하고, 예산 소진 속도가 적절한지 50자 이내로 건조하게 브리핑해 주세요.
수치를 임의로 바꾸지 마세요.

데이터: ${dataText}

한 줄 브리핑:`;
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? getFallbackMessage(reportType);
  }

  if (reportType === "THU_PROPOSAL") {
    const prompt = `역할: 신중한 전략가.
아래 데이터를 바탕으로 주말·다음 주를 대비한 "안전한" 운영 제안을 1가지만, 50자 이내로 작성해 주세요.

제약 사항 (반드시 지킬 것):
- 새로운 예산 증액 제안 금지. 기존 예산의 20% 이내 소폭 조정만 언급 가능.
- "예산 2배", "대폭 증액" 등 무리한 제안 금지.
- 현재 효율이 좋은 소재 유지, 소재 교체·최적화 관점의 제안만.

데이터: ${dataText}

한 줄 제안:`;
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() ?? getFallbackMessage(reportType);
  }

  return getFallbackMessage(reportType);
}

function getFallbackMessage(reportType: NotificationReportType): string {
  if (reportType === "MON_REVIEW") return "지난주 성과 요약을 확인해 주세요.";
  if (reportType === "WED_BUDGET") return "예산 소진 속도를 확인해 주세요.";
  if (reportType === "THU_PROPOSAL") return "다음 주 운영 제안을 확인해 주세요.";
  return "내용을 확인해 주세요.";
}
