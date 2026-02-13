/**
 * Google Gemini AI를 사용한 마케팅 보고서 자동 생성
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";

const MODEL_NAME = "gemini-1.5-flash";

interface MetricSummary {
  platform: string;
  metrics: Record<string, { total: number; avg: number; count: number }>;
  dateRange: { from: string; to: string };
}

/**
 * 특정 클라이언트의 기간별 지표 요약 생성
 */
export async function getMetricSummary(
  supabase: SupabaseClient,
  clientId: string,
  dateFrom: string,
  dateTo: string,
): Promise<MetricSummary[]> {
  const { data: rawMetrics } = await supabase
    .from("platform_metrics")
    .select("platform, metric_key, metric_value, metric_date")
    .eq("client_id", clientId)
    .gte("metric_date", dateFrom)
    .lte("metric_date", dateTo);

  if (!rawMetrics || rawMetrics.length === 0) return [];

  // 플랫폼별로 그룹핑
  const byPlatform: Record<string, Record<string, number[]>> = {};

  for (const row of rawMetrics) {
    if (!byPlatform[row.platform]) byPlatform[row.platform] = {};
    if (!byPlatform[row.platform][row.metric_key]) byPlatform[row.platform][row.metric_key] = [];
    byPlatform[row.platform][row.metric_key].push(row.metric_value);
  }

  return Object.entries(byPlatform).map(([platform, metrics]) => ({
    platform,
    metrics: Object.fromEntries(
      Object.entries(metrics).map(([key, values]) => [
        key,
        {
          total: values.reduce((a, b) => a + b, 0),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
        },
      ]),
    ),
    dateRange: { from: dateFrom, to: dateTo },
  }));
}

/**
 * Gemini AI에 마케팅 보고서 생성 요청
 */
export async function generateMarketingReport(
  clientName: string,
  metricSummaries: MetricSummary[],
  reportType: "weekly" | "monthly" = "weekly",
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const periodLabel = reportType === "weekly" ? "주간" : "월간";

  // 메트릭 데이터를 텍스트로 포맷
  const metricsText = metricSummaries
    .map((s) => {
      const platformName = {
        naver_ads: "네이버 검색광고",
        meta_ads: "Meta 광고",
        google_ads: "Google Ads",
        google_analytics: "Google Analytics",
      }[s.platform] || s.platform;

      const metricsLines = Object.entries(s.metrics)
        .map(([key, v]) => {
          const metricLabel = {
            impressions: "노출수",
            clicks: "클릭수",
            cost: "비용(원)",
            conversions: "전환수",
            ctr: "클릭률(%)",
            cpc: "클릭당비용",
            cpm: "천회노출비용",
            reach: "도달",
            sessions: "세션수",
            users: "사용자수",
            pageviews: "페이지뷰",
            bounce_rate: "이탈률(%)",
          }[key] || key;
          return `  - ${metricLabel}: 합계 ${v.total.toLocaleString()}, 일평균 ${v.avg.toFixed(1)}`;
        })
        .join("\n");

      return `\n### ${platformName} (${s.dateRange.from} ~ ${s.dateRange.to})\n${metricsLines}`;
    })
    .join("\n");

  const prompt = `당신은 디지털 마케팅 전문가입니다. 아래 마케팅 데이터를 분석하여 ${clientName}의 ${periodLabel} 마케팅 성과 보고서를 한국어로 작성해주세요.

## 보고서 형식
- HTML 형식으로 작성 (Tiptap 에디터에서 렌더링됩니다)
- <h2> 태그로 섹션 제목
- <ul>/<li> 태그로 핵심 인사이트
- <p> 태그로 분석 내용
- <strong>, <em> 등 강조 활용

## 포함할 섹션
1. **종합 요약** - 전체 성과를 2-3문장으로 요약
2. **플랫폼별 성과 분석** - 각 플랫폼의 주요 지표 분석
3. **핵심 인사이트** - 눈에 띄는 트렌드나 변화점
4. **개선 제안** - 데이터 기반 구체적 개선 방안 3-5가지
5. **다음 주기 액션 아이템** - 실행 가능한 과제

## 마케팅 데이터
${metricsText || "수집된 데이터가 없습니다."}

보고서를 작성해주세요:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * 보고서 자동 생성 및 발행 (cron에서 호출)
 */
export async function autoGenerateAndPublish(
  supabase: SupabaseClient,
  clientId: string,
  clientName: string,
  reportType: "weekly" | "monthly",
  dateFrom: string,
  dateTo: string,
): Promise<{ reportId: string; title: string } | null> {
  const summaries = await getMetricSummary(supabase, clientId, dateFrom, dateTo);

  if (summaries.length === 0) return null;

  const content = await generateMarketingReport(clientName, summaries, reportType);
  const periodLabel = reportType === "weekly" ? "주간" : "월간";
  const title = `[AI] ${clientName} ${periodLabel} 마케팅 성과 보고서 (${dateFrom} ~ ${dateTo})`;

  const { data: report } = await supabase
    .from("reports")
    .insert({
      client_id: clientId,
      report_type: reportType,
      title,
      summary: content,
      file_path: "",
      published_at: new Date().toISOString(),
      visibility: "visible",
      created_by: "system",
    })
    .select("id")
    .single();

  return report ? { reportId: report.id, title } : null;
}
