/**
 * 알림톡용 AI 요약 문구 생성
 *
 * [프롬프트 일관성 원칙]
 * 1. 모든 프롬프트는 "서비스: 원마케팅" + "역할:" 으로 시작
 * 2. 공통 제약: 50자 이내, 수치 변조 금지, 한국어, 존댓말 X (간결체)
 * 3. 톤은 페르소나별로 달라지되, 출력 형식("한 줄 OOO:")은 동일
 * 4. 숫자는 코드로 계산, AI는 문장만 생성 (할루시네이션 방지)
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMetricSummary } from "./report-generator";
import type { NotificationReportType } from "@/lib/types/database";

const MODEL_NAME = "gemini-1.5-flash";

const COMMON_RULES = `공통 규칙 (반드시 지킬 것):
- 서비스명: 원마케팅. 답변에 서비스명을 넣지 말 것.
- 50자 이내 한국어 한 줄로 답변. 줄바꿈 금지.
- 데이터 수치를 임의로 바꾸거나 만들지 말 것.
- 존댓말 대신 간결체(~함, ~됨, ~임) 사용.
- 따옴표, 큰따옴표로 감싸지 말 것.
- 데이터가 비어 있거나 0이면 "확인이 필요합니다"로 마무리.`;

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
    let totalImpressions = 0;
    let totalConversions = 0;
    for (const s of summaries) {
      const m = s.metrics as Record<string, { total: number }>;
      const cost = m.cost ?? m.spend;
      if (cost) totalCost += cost.total;
      if (m.clicks) totalClicks += m.clicks.total;
      if (m.impressions) totalImpressions += m.impressions.total;
      if (m.conversions) totalConversions += m.conversions.total;
    }
    const spend = Math.round(totalCost);
    const cpc = totalClicks > 0 ? Math.round(totalCost / totalClicks) : undefined;
    const ctr = totalImpressions > 0 ? +(totalClicks / totalImpressions * 100).toFixed(1) : undefined;
    const snapshot: Record<string, unknown> = {
      ...(spend > 0 && { spend }),
      ...(totalClicks > 0 && { clicks: totalClicks }),
      ...(totalImpressions > 0 && { impressions: totalImpressions }),
      ...(totalConversions > 0 && { conversions: totalConversions }),
      ...(cpc !== undefined && { cpc }),
      ...(ctr !== undefined && { ctr }),
      period: `${dateFrom} ~ ${dateTo}`,
    };

    // 수기 입력 채널 데이터 추가 (지난 7일 이내 입력된 것)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().slice(0, 10);

    const { data: manualData } = await supabase
      .from("manual_metrics")
      .select("channel_type, channel_name, metrics, memo")
      .eq("client_id", clientId)
      .gte("period_end", weekStr)
      .order("created_at", { ascending: false })
      .limit(3);

    if (manualData && manualData.length > 0) {
      const experiential = manualData.filter((d: { channel_type: string }) => d.channel_type === 'EXPERIENTIAL');
      if (experiential.length > 0) {
        const m = experiential[0].metrics as Record<string, number>;
        if (m.completed || m.participants) {
          return {
            ...snapshot,
            experiential_completed: m.completed ?? m.participants ?? 0,
            experiential_posts: (m.blog_posts ?? 0) + (m.insta_posts ?? 0),
            experiential_views: m.total_views ?? 0,
          };
        }
      }
      const seo = manualData.filter((d: { channel_type: string }) => d.channel_type === 'SEO');
      if (seo.length > 0) {
        const m = seo[0].metrics as Record<string, unknown>;
        if (m.main_keyword) {
          return {
            ...snapshot,
            seo_keyword: m.main_keyword as string,
            seo_rank: m.main_rank as number,
            seo_prev_rank: m.prev_rank as number,
            seo_top3_count: m.top3_count as number,
            seo_target_count: m.target_keywords as number,
          };
        }
      }
    }

    return snapshot;
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
    const snapshot: Record<string, unknown> = {
      spendThisMonth: Math.round(totalSpend),
      daysRemaining,
      daysInMonth,
    };

    // 수기 입력 채널 데이터 추가 (지난 7일 이내 입력된 것)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().slice(0, 10);

    const { data: manualData } = await supabase
      .from("manual_metrics")
      .select("channel_type, channel_name, metrics, memo")
      .eq("client_id", clientId)
      .gte("period_end", weekStr)
      .order("created_at", { ascending: false })
      .limit(3);

    if (manualData && manualData.length > 0) {
      const experiential = manualData.filter((d: { channel_type: string }) => d.channel_type === 'EXPERIENTIAL');
      if (experiential.length > 0) {
        const m = experiential[0].metrics as Record<string, number>;
        if (m.completed || m.participants) {
          return {
            ...snapshot,
            experiential_completed: m.completed ?? m.participants ?? 0,
            experiential_posts: (m.blog_posts ?? 0) + (m.insta_posts ?? 0),
            experiential_views: m.total_views ?? 0,
          };
        }
      }
      const seo = manualData.filter((d: { channel_type: string }) => d.channel_type === 'SEO');
      if (seo.length > 0) {
        const m = seo[0].metrics as Record<string, unknown>;
        if (m.main_keyword) {
          return {
            ...snapshot,
            seo_keyword: m.main_keyword as string,
            seo_rank: m.main_rank as number,
            seo_prev_rank: m.prev_rank as number,
            seo_top3_count: m.top3_count as number,
            seo_target_count: m.target_keywords as number,
          };
        }
      }
    }

    return snapshot;
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
    const snapshot: Record<string, unknown> = {
      lastWeekSpend: Math.round(totalCost),
      lastWeekConversions: totalConversions,
    };

    // 수기 입력 채널 데이터 추가 (지난 7일 이내 입력된 것)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().slice(0, 10);

    const { data: manualData } = await supabase
      .from("manual_metrics")
      .select("channel_type, channel_name, metrics, memo")
      .eq("client_id", clientId)
      .gte("period_end", weekStr)
      .order("created_at", { ascending: false })
      .limit(3);

    if (manualData && manualData.length > 0) {
      const experiential = manualData.filter((d: { channel_type: string }) => d.channel_type === 'EXPERIENTIAL');
      if (experiential.length > 0) {
        const m = experiential[0].metrics as Record<string, number>;
        if (m.completed || m.participants) {
          return {
            ...snapshot,
            experiential_completed: m.completed ?? m.participants ?? 0,
            experiential_posts: (m.blog_posts ?? 0) + (m.insta_posts ?? 0),
            experiential_views: m.total_views ?? 0,
          };
        }
      }
      const seo = manualData.filter((d: { channel_type: string }) => d.channel_type === 'SEO');
      if (seo.length > 0) {
        const m = seo[0].metrics as Record<string, unknown>;
        if (m.main_keyword) {
          return {
            ...snapshot,
            seo_keyword: m.main_keyword as string,
            seo_rank: m.main_rank as number,
            seo_prev_rank: m.prev_rank as number,
            seo_top3_count: m.top3_count as number,
            seo_target_count: m.target_keywords as number,
          };
        }
      }
    }

    return snapshot;
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
톤: 칭찬·격려 톤. 이모지 1개 포함 가능.

${COMMON_RULES}

아래는 지난주 마케팅 성과 데이터(코드로 계산된 수치)입니다.

데이터: ${dataText}

한 줄 요약:`;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      return text ? text.slice(0, 50) : getFallbackMessage(reportType);
    } catch (err) {
      console.error("[AI] generateContent 실패 (MON_REVIEW):", err);
      return getFallbackMessage(reportType);
    }
  }

  if (reportType === "WED_BUDGET") {
    const prompt = `역할: 냉철한 예산 관리자.
톤: 감정 배제, 건조하게 팩트만. 이모지 사용 금지.

${COMMON_RULES}

아래는 현재 월 예산 소진 관련 데이터입니다. 예산 소진 속도가 적절한지 판단해 주세요.

데이터: ${dataText}

한 줄 브리핑:`;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      return text ? text.slice(0, 50) : getFallbackMessage(reportType);
    } catch (err) {
      console.error("[AI] generateContent 실패 (WED_BUDGET):", err);
      return getFallbackMessage(reportType);
    }
  }

  if (reportType === "THU_PROPOSAL") {
    const prompt = `역할: 신중한 전략가.
톤: 신중하고 안전한 제안. 이모지 사용 금지.

${COMMON_RULES}

추가 제약 사항:
- 새로운 예산 증액 제안 금지. 기존 예산의 20% 이내 소폭 조정만 언급 가능.
- "예산 2배", "대폭 증액" 등 무리한 제안 금지.
- 현재 효율이 좋은 소재 유지, 소재 교체·최적화 관점의 제안 1가지만.

아래 데이터를 바탕으로 주말·다음 주를 대비한 운영 제안을 작성해 주세요.

데이터: ${dataText}

한 줄 제안:`;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      return text ? text.slice(0, 50) : getFallbackMessage(reportType);
    } catch (err) {
      console.error("[AI] generateContent 실패 (THU_PROPOSAL):", err);
      return getFallbackMessage(reportType);
    }
  }

  return getFallbackMessage(reportType);
}

/**
 * 보고서 발행 알림톡용 AI 브리프 (한 줄 요약)
 * 페르소나: 간결한 보고서 요약가 — 감정 최소, 핵심 한 줄, 50자 이내
 */
export async function getReportBrief(
  title: string,
  summary: string | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const text = summary || title;

  if (!apiKey || !text.trim()) {
    return text.slice(0, 50);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `역할: 간결한 보고서 요약가.
톤: 감정 최소, 사실 중심. 이모지 사용 금지.

${COMMON_RULES}

아래는 마케팅 보고서의 제목과 본문입니다. 핵심 내용을 한 줄로 요약해 주세요.
본문이 없으면 제목만으로 요약.

제목: ${title}
본문: ${(summary || "").slice(0, 500)}

한 줄 요약:`;

    const result = await model.generateContent(prompt);
    const brief = result.response.text()?.trim();
    return brief || text.slice(0, 50);
  } catch {
    return text.slice(0, 50);
  }
}

function getFallbackMessage(reportType: NotificationReportType): string {
  if (reportType === "MON_REVIEW") return "지난주 성과 요약을 확인해 주세요.";
  if (reportType === "WED_BUDGET") return "예산 소진 속도를 확인해 주세요.";
  if (reportType === "THU_PROPOSAL") return "다음 주 운영 제안을 확인해 주세요.";
  return "내용을 확인해 주세요.";
}
