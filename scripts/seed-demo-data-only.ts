/**
 * 기존 데모 계정은 그대로 두고, 데모 클라이언트에만 목업 데이터 추가
 * (사용자 삭제 없이 실행 가능)
 * 실행: npx tsx scripts/seed-demo-data-only.ts
 * 필요 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const DEMO_CLIENT_ID = "c0000000-0000-0000-0000-000000000001";

const scriptDir = typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

function loadEnvLocal() {
  const candidates = [
    resolve(projectRoot, ".env.local"),
    resolve(projectRoot, ".env.seed"),
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env.seed"),
    resolve(process.cwd(), "..", ".env.local"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    let content = readFileSync(p, "utf-8");
    content = content.replace(/^\uFEFF/, "");
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.replace(/\r$/, "").trim();
      if (!line || line.startsWith("#")) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].replace(/^["']|["']$/g, "").replace(/\r$/, "").trim();
    }
  }
}

loadEnvLocal();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. .env.local 또는 .env.seed 를 설정하세요.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function toDate(s: string): string {
  return new Date(s).toISOString().split("T")[0];
}

async function main() {
  console.log("데모 클라이언트에 목업 데이터만 추가합니다 (기존 계정 유지).");

  const { data: clientRow } = await supabase.from("clients").select("id").eq("id", DEMO_CLIENT_ID).single();
  if (!clientRow) {
    console.error("데모 클라이언트가 없습니다. 먼저 seed-demo-account.ts 를 한 번 실행하거나, Supabase에 클라이언트", DEMO_CLIENT_ID, "를 생성하세요.");
    process.exit(1);
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("client_id", DEMO_CLIENT_ID)
    .limit(1)
    .single();
  const userId = profileRow?.user_id;
  if (!userId) {
    console.error("데모 클라이언트에 연결된 사용자(프로필)가 없습니다. 해당 클라이언트로 로그인된 계정이 있어야 created_by 에 넣을 수 있습니다.");
    process.exit(1);
  }
  console.log("사용자 ID (created_by):", userId);

  const now = new Date();
  const today = toDate(now.toISOString());
  const lastWeek = toDate(new Date(now.getTime() - 7 * 86400000).toISOString());
  const weekBefore = toDate(new Date(now.getTime() - 14 * 86400000).toISOString());
  const week3 = toDate(new Date(now.getTime() - 21 * 86400000).toISOString());
  const week4 = toDate(new Date(now.getTime() - 28 * 86400000).toISOString());
  const nextWeek = toDate(new Date(now.getTime() + 7 * 86400000).toISOString());
  const monthStart = toDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
  const twoMonthsAgo = toDate(new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString());

  const { data: projectsData, error: projectsErr1 } = await supabase
    .from("projects")
    .insert([
      { client_id: DEMO_CLIENT_ID, project_type: "landing", title: "프로모션 랜딩 페이지", stage: "design", progress: 40, visibility: "visible", created_by: userId },
      { client_id: DEMO_CLIENT_ID, project_type: "website", title: "리뉴얼 프로젝트", stage: "planning", progress: 10, visibility: "visible", created_by: userId },
      { client_id: DEMO_CLIENT_ID, project_type: "promotion", title: "시즌 이벤트 페이지", stage: "dev", progress: 65, visibility: "visible", created_by: userId },
      { client_id: DEMO_CLIENT_ID, project_type: "landing", title: "신규 상품 런칭 랜딩", stage: "qa", progress: 90, visibility: "visible", created_by: userId },
      { client_id: DEMO_CLIENT_ID, project_type: "website", title: "블로그 섹션 개편", stage: "done", progress: 100, visibility: "visible", created_by: userId },
    ])
    .select("id");
  const projectIds = projectsErr1 || !projectsData?.length ? [] : projectsData.map((p: { id: string }) => p.id);
  const projLanding = projectIds[0] ?? null;
  const projEvent = projectIds[2] ?? null;
  if (projectsErr1) console.warn("projects insert 경고:", projectsErr1.message);
  else console.log("목업 projects 삽입 완료: 5건");

  const actionRows = [
    { client_id: DEMO_CLIENT_ID, category: "general", title: "랜딩페이지 A/B 테스트", description: "프로모션 랜딩 페이지의 헤드라인·CTA 버튼 2안을 50:50 분할 테스트로 진행했습니다. 2주간 유입 1,200명 기준 전환율 3.2% → 3.8%로 상승하여 B안을 메인으로 적용했습니다.", status: "done", action_date: weekBefore, end_date: lastWeek, visibility: "visible", created_by: userId, links: [{ url: "https://example.com/landing-a", label: "A안 미리보기" }, { url: "https://example.com/landing-b", label: "B안 미리보기" }] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "광고 소재 업데이트", description: "메타·네이버 신규 소재 3종 제작 및 업로드 완료. 이번 주 내 크리에이티브 피드백 반영 후 배포 예정입니다.", status: "in_progress", action_date: today, visibility: "visible", created_by: userId, links: [{ url: "https://ads.example.com", label: "광고 관리자" }] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "월간 리포트 검토", description: "지난달 KPI 달성률·채널별 성과를 정리한 월간 리포트 검토 및 다음 달 목표 설정 회의가 예정되어 있습니다.", status: "planned", action_date: nextWeek, visibility: "visible", created_by: userId, links: [] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "네이버 검색광고 키워드 확장", description: "상품·서비스 관련 롱테일 키워드 15개 추가 입찰 설정. 기존 대비 CPC 12% 절감 효과를 목표로 합니다.", status: "done", action_date: lastWeek, visibility: "visible", created_by: userId, links: [{ url: "https://searchad.naver.com", label: "네이버 검색광고" }] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "메타 픽셀 전환 이벤트 점검", description: "구매·가입·문의 전환 이벤트가 정상 발송되는지 픽셀 디버거로 확인하고, 전환 API 보강 적용을 완료했습니다.", status: "done", action_date: lastWeek, visibility: "visible", created_by: userId, links: [] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "GA4 목표 설정 및 리마케팅 오디언스 생성", description: "GA4에서 전환 목표 3종 설정 및 30일·90일 방문자 리마케팅 오디언스 생성. 구글·메타 광고와 연동했습니다.", status: "done", action_date: week3, visibility: "visible", created_by: userId, links: [{ url: "https://analytics.google.com", label: "GA4" }] },
    { client_id: DEMO_CLIENT_ID, project_id: projEvent, category: "general", title: "이벤트 페이지 오픈 및 UTM 태깅", description: "시즌 이벤트 페이지 오픈 및 캠페인별 UTM 파라미터 적용 완료. 네이버·메타·메일 유입 구분이 가능합니다.", status: "done", action_date: week4, visibility: "visible", created_by: userId, links: [{ url: "https://example.com/event", label: "이벤트 페이지" }] },
    { client_id: DEMO_CLIENT_ID, category: "general", title: "주간 성과 회의 및 다음 주 캠페인 기획", description: "주간 성과 리뷰와 다음 주 캠페인 예산·타겟·소재 방향을 논의하는 정기 회의입니다.", status: "planned", action_date: nextWeek, visibility: "visible", created_by: userId, links: [] },
    { client_id: DEMO_CLIENT_ID, project_id: projLanding, category: "general", title: "크리에이티브 리프레시 (이미지/카피)", description: "프로모션 랜딩 페이지용 신규 메인 비주얼 및 카피 2안 제작 중. 클라이언트 피드백 후 최종안 확정 예정입니다.", status: "hold", action_date: today, visibility: "visible", created_by: userId, links: [] },
  ];
  const { error: actionsErr } = await supabase.from("actions").insert(actionRows);
  if (actionsErr) console.warn("actions insert 경고:", actionsErr.message);
  else console.log("목업 actions 삽입 완료: 9건");

  const baseDay = new Date(now);
  baseDay.setHours(0, 0, 0, 0);
  const calendarRows = [
    { client_id: DEMO_CLIENT_ID, title: "광고 캠페인 기획 회의", start_at: new Date(baseDay.getTime() + 1 * 86400000 + 10 * 3600000).toISOString(), end_at: new Date(baseDay.getTime() + 1 * 86400000 + 11 * 3600000).toISOString(), status: "planned" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "주간 성과 점검", start_at: new Date(baseDay.getTime() + 3 * 86400000 + 14 * 3600000).toISOString(), end_at: new Date(baseDay.getTime() + 3 * 86400000 + 15 * 3600000 + 30 * 60000).toISOString(), status: "planned" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "이벤트 페이지 오픈", start_at: new Date(baseDay.getTime() - 2 * 86400000).toISOString(), status: "done" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "월간 리포트 발송", start_at: new Date(baseDay.getTime() - 5 * 86400000 + 9 * 3600000).toISOString(), status: "done" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "메타 광고 계정 구조 검토", start_at: new Date(baseDay.getTime() + 5 * 86400000 + 11 * 3600000).toISOString(), end_at: new Date(baseDay.getTime() + 5 * 86400000 + 12 * 3600000).toISOString(), status: "planned" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "구글 광고 입찰 전략 조정", start_at: new Date(baseDay.getTime() + 7 * 86400000 + 15 * 3600000).toISOString(), end_at: new Date(baseDay.getTime() + 7 * 86400000 + 16 * 3600000).toISOString(), status: "planned" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "크리에이티브 제작 킥오프", start_at: new Date(baseDay.getTime() - 7 * 86400000 + 14 * 3600000).toISOString(), status: "done" as const, visibility: "visible" as const, created_by: userId },
    { client_id: DEMO_CLIENT_ID, title: "분기 목표 리뷰 및 KPI 설정", start_at: new Date(baseDay.getTime() + 14 * 86400000 + 10 * 3600000).toISOString(), end_at: new Date(baseDay.getTime() + 14 * 86400000 + 12 * 3600000).toISOString(), status: "planned" as const, visibility: "visible" as const, created_by: userId },
  ];
  const { error: eventsErr } = await supabase.from("calendar_events").insert(calendarRows);
  if (eventsErr) console.warn("calendar_events insert 경고:", eventsErr.message);
  else console.log("목업 calendar_events 삽입 완료:", calendarRows.length, "건");

  const reportSummaryHtml = (title: string, type: string) =>
    `<h2>${title}</h2><p><strong>리포트 유형:</strong> ${type}</p><p>본 주간/월간 성과 요약은 데모용 목업 데이터입니다. 실제 서비스에서는 KPI 달성률, 채널별 성과, 전환 추이, 다음 주/다음 달 액션 플랜이 포함됩니다.</p><p>주요 지표: 방문자 수 전주 대비 5% 증가, 리드 55건 수집, 전환율 3.6% 유지. 광고비 대비 ROAS 목표 대비 102% 달성.</p>`;

  const { error: reportsErr } = await supabase.from("reports").insert([
    { client_id: DEMO_CLIENT_ID, report_type: "weekly", title: "주간 성과 리포트 1주차", summary: reportSummaryHtml("주간 성과 리포트 1주차", "주간"), file_path: "/reports/demo-w1.pdf", published_at: lastWeek, visibility: "visible", created_by: userId },
    { client_id: DEMO_CLIENT_ID, report_type: "weekly", title: "주간 성과 리포트 2주차", summary: reportSummaryHtml("주간 성과 리포트 2주차", "주간"), file_path: "/reports/demo-w2.pdf", published_at: weekBefore, visibility: "visible", created_by: userId },
    { client_id: DEMO_CLIENT_ID, report_type: "weekly", title: "주간 성과 리포트 3주차", summary: reportSummaryHtml("주간 성과 리포트 3주차", "주간"), file_path: "/reports/demo-w3.pdf", published_at: week3, visibility: "visible", created_by: userId },
    { client_id: DEMO_CLIENT_ID, report_type: "monthly", title: "월간 마케팅 리포트 (이번 달)", summary: reportSummaryHtml("월간 마케팅 리포트 (이번 달)", "월간"), file_path: "/reports/demo-monthly-current.pdf", published_at: toDate(monthStart), visibility: "visible", created_by: userId },
    { client_id: DEMO_CLIENT_ID, report_type: "monthly", title: "월간 마케팅 리포트 (지난 달)", summary: reportSummaryHtml("월간 마케팅 리포트 (지난 달)", "월간"), file_path: "/reports/demo-monthly-prev.pdf", published_at: twoMonthsAgo, visibility: "visible", created_by: userId },
    { client_id: DEMO_CLIENT_ID, report_type: "weekly", title: "주간 성과 리포트 4주차", summary: reportSummaryHtml("주간 성과 리포트 4주차", "주간"), file_path: "/reports/demo-w4.pdf", published_at: week4, visibility: "visible", created_by: userId },
  ]);
  if (reportsErr) console.warn("reports insert 경고:", reportsErr.message);
  else console.log("목업 reports 삽입 완료: 6건");

  const kpiDefs = [
    { client_id: DEMO_CLIENT_ID, metric_key: "visitors", metric_label: "방문자 수", unit: "명", show_on_overview: true, overview_order: 1, chart_enabled: true, description: "주간 웹사이트 방문자 수", validation_rule: { required: true, integer: true, min: 0 } },
    { client_id: DEMO_CLIENT_ID, metric_key: "leads", metric_label: "리드 수", unit: "건", show_on_overview: true, overview_order: 2, chart_enabled: true, description: "주간 리드 생성 수", validation_rule: { required: true, integer: true, min: 0 } },
    { client_id: DEMO_CLIENT_ID, metric_key: "conversion_rate", metric_label: "전환율", unit: "%", show_on_overview: true, overview_order: 3, chart_enabled: true, description: "주간 전환율", validation_rule: { required: true, min: 0, max: 100 } },
    { client_id: DEMO_CLIENT_ID, metric_key: "ad_spend", metric_label: "광고비", unit: "만원", show_on_overview: true, overview_order: 4, chart_enabled: false, description: "월간 광고 집행비", validation_rule: { required: true, min: 0 } },
  ];
  const { error: kpiErr } = await supabase.from("kpi_definitions").upsert(kpiDefs, { onConflict: "client_id,metric_key" });
  if (kpiErr) console.warn("kpi_definitions upsert 경고:", kpiErr.message);
  else console.log("목업 KPI 정의 반영: 4건");

  const metricsRows: { client_id: string; period_type: "weekly" | "monthly"; period_start: string; period_end: string; metric_key: string; value: number; visibility: string; created_by: string }[] = [];
  const keyWeekly: Record<string, (w: number) => number> = {
    visitors: (w) => 3200 + w * 80 + (w % 3) * 200,
    leads: (w) => 45 + w * 2 + (w % 2) * 10,
    conversion_rate: (w) => 3.2 + (w % 5) * 0.15,
    ad_spend: (w) => 280 + w * 5,
  };
  const keyMonthly: Record<string, (m: number) => number> = {
    visitors: (m) => 14000 + m * 500,
    leads: (m) => 200 + m * 15,
    conversion_rate: (m) => 3.4 + (m % 4) * 0.1,
    ad_spend: (m) => 1200 + m * 50,
  };
  for (let w = 0; w < 12; w++) {
    const d = new Date(now.getTime() - (11 - w) * 7 * 86400000);
    const periodStart = toDate(d.toISOString());
    const periodEnd = toDate(new Date(d.getTime() + 6 * 86400000).toISOString());
    for (const key of ["visitors", "leads", "conversion_rate", "ad_spend"]) {
      metricsRows.push({ client_id: DEMO_CLIENT_ID, period_type: "weekly", period_start: periodStart, period_end: periodEnd, metric_key: key, value: keyWeekly[key](w), visibility: "visible", created_by: userId });
    }
  }
  for (let m = 0; m < 6; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - m), 1);
    const periodStart = toDate(d.toISOString());
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const periodEnd = toDate(last.toISOString());
    for (const key of ["visitors", "leads", "conversion_rate", "ad_spend"]) {
      metricsRows.push({ client_id: DEMO_CLIENT_ID, period_type: "monthly", period_start: periodStart, period_end: periodEnd, metric_key: key, value: keyMonthly[key](m), visibility: "visible", created_by: userId });
    }
  }
  const { error: metricsErr } = await supabase.from("metrics").insert(metricsRows);
  if (metricsErr) console.warn("metrics insert 경고:", metricsErr.message);
  else console.log("목업 metrics 삽입 완료: 주별 12주 + 월별 6개월");

  let naverId: string | null = null;
  let gaId: string | null = null;
  const { data: existingInt } = await supabase
    .from("data_integrations")
    .select("id, platform")
    .eq("client_id", DEMO_CLIENT_ID)
    .in("platform", ["naver_ads", "google_analytics"]);
  if (existingInt?.length) {
    naverId = existingInt.find((i: { platform: string }) => i.platform === "naver_ads")?.id ?? null;
    gaId = existingInt.find((i: { platform: string }) => i.platform === "google_analytics")?.id ?? null;
  }
  if (!naverId || !gaId) {
    const { data: newInt, error: intErr } = await supabase
      .from("data_integrations")
      .insert([
        ...(!naverId ? [{ client_id: DEMO_CLIENT_ID, platform: "naver_ads", display_name: "네이버 광고 (데모)", credentials: {}, config: {}, status: "active", created_by: userId }] : []),
        ...(!gaId ? [{ client_id: DEMO_CLIENT_ID, platform: "google_analytics", display_name: "GA4 (데모)", credentials: {}, config: {}, status: "active", created_by: userId }] : []),
      ])
      .select("id, platform");
    if (!intErr && newInt?.length) {
      if (!naverId) naverId = newInt.find((i: { platform: string }) => i.platform === "naver_ads")?.id ?? null;
      if (!gaId) gaId = newInt.find((i: { platform: string }) => i.platform === "google_analytics")?.id ?? null;
    }
  }
  if (naverId || gaId) {
    const platformMetricsRows: { client_id: string; integration_id: string; platform: string; metric_date: string; metric_key: string; metric_value: number }[] = [];
    for (let d = 0; d < 30; d++) {
      const dte = new Date(now.getTime() - d * 86400000);
      const dateStr = toDate(dte.toISOString());
      const dayFactor = 1 + (d % 7) * 0.1;
      if (naverId) {
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: naverId, platform: "naver_ads", metric_date: dateStr, metric_key: "impressions", metric_value: Math.round(40000 * dayFactor + d * 200) });
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: naverId, platform: "naver_ads", metric_date: dateStr, metric_key: "clicks", metric_value: Math.round(1200 * dayFactor + d * 15) });
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: naverId, platform: "naver_ads", metric_date: dateStr, metric_key: "cost", metric_value: Math.round(280000 * dayFactor + d * 5000) });
      }
      if (gaId) {
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: gaId, platform: "google_analytics", metric_date: dateStr, metric_key: "sessions", metric_value: Math.round(450 * dayFactor + d * 8) });
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: gaId, platform: "google_analytics", metric_date: dateStr, metric_key: "users", metric_value: Math.round(320 * dayFactor + d * 5) });
        platformMetricsRows.push({ client_id: DEMO_CLIENT_ID, integration_id: gaId, platform: "google_analytics", metric_date: dateStr, metric_key: "pageviews", metric_value: Math.round(1200 * dayFactor + d * 20) });
      }
    }
    if (platformMetricsRows.length > 0) {
      const { error: pmErr } = await supabase.from("platform_metrics").insert(platformMetricsRows);
      if (pmErr) console.warn("platform_metrics insert 경고:", pmErr.message);
      else console.log("목업 platform_metrics 삽입 완료: 일자별", platformMetricsRows.length, "건");
    }
  }

  console.log("\n완료. 데모 계정으로 로그인한 뒤 개요/실행/캘린더/프로젝트/리포트에서 목업 데이터를 확인하세요.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
