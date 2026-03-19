/**
 * Vercel Cron — 광고 성과 이상 감지
 * 4시간마다 실행: 0 *\/4 * * *
 *
 * 로직:
 * 1. 모든 활성 클라이언트의 오늘 platform_metrics 조회
 * 2. 최근 7일 평균(baseline)과 비교
 * 3. 임계치 초과 시 performance_alerts 생성
 * 4. 중복 방지: 동일 타입 알림이 6시간 내 존재하면 skip
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// 이상 감지 임계치
const THRESHOLDS = {
  impression_drop: -0.5,   // 노출 50% 이상 감소
  cpc_spike:        0.8,   // CPC 80% 이상 상승
  roas_drop:       -0.4,   // ROAS 40% 이상 감소
  ctr_drop:        -0.4,   // CTR 40% 이상 감소
  spend_spike:      1.0,   // 지출 100% 이상 급증
} as const;

type AlertType = keyof typeof THRESHOLDS;

const ALERT_LABELS: Record<AlertType, string> = {
  impression_drop: "노출 급감",
  cpc_spike:       "CPC 급등",
  roas_drop:       "ROAS 하락",
  ctr_drop:        "CTR 하락",
  spend_spike:     "광고비 급증",
};

const METRIC_KEYS: Record<AlertType, string[]> = {
  impression_drop: ["impressions"],
  cpc_spike:       ["cpc", "cost_per_click"],
  roas_drop:       ["roas", "purchase_roas"],
  ctr_drop:        ["ctr", "click_through_rate"],
  spend_spike:     ["spend", "cost"],
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // 활성 클라이언트 목록
  const { data: clients } = await svc
    .from("clients")
    .select("id, name")
    .eq("is_active", true);

  if (!clients?.length) return NextResponse.json({ message: "활성 클라이언트 없음" });

  let created = 0;
  let skipped = 0;

  for (const client of clients) {
    // 오늘 + 어제 메트릭 (가장 최신 데이터)
    const { data: recentMetrics } = await svc
      .from("platform_metrics")
      .select("metric_key, metric_value, metric_date")
      .eq("client_id", client.id)
      .gte("metric_date", yesterday)
      .lte("metric_date", today);

    if (!recentMetrics?.length) continue;

    // 7일 baseline 메트릭
    const { data: baselineMetrics } = await svc
      .from("platform_metrics")
      .select("metric_key, metric_value")
      .eq("client_id", client.id)
      .gte("metric_date", sevenDaysAgo)
      .lt("metric_date", yesterday);

    if (!baselineMetrics?.length) continue;

    // metric_key별 평균 계산
    const baselineByKey: Record<string, number> = {};
    const baselineCount: Record<string, number> = {};
    for (const m of baselineMetrics) {
      if (!baselineByKey[m.metric_key]) { baselineByKey[m.metric_key] = 0; baselineCount[m.metric_key] = 0; }
      baselineByKey[m.metric_key] += Number(m.metric_value);
      baselineCount[m.metric_key]++;
    }
    for (const key of Object.keys(baselineByKey)) {
      baselineByKey[key] = baselineByKey[key] / baselineCount[key];
    }

    // 최신 값 (어제 or 오늘 합산 평균)
    const recentByKey: Record<string, number> = {};
    const recentCount: Record<string, number> = {};
    for (const m of recentMetrics) {
      if (!recentByKey[m.metric_key]) { recentByKey[m.metric_key] = 0; recentCount[m.metric_key] = 0; }
      recentByKey[m.metric_key] += Number(m.metric_value);
      recentCount[m.metric_key]++;
    }
    for (const key of Object.keys(recentByKey)) {
      recentByKey[key] = recentByKey[key] / recentCount[key];
    }

    // 6시간 이내 기존 알림 확인 (중복 방지)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await svc
      .from("performance_alerts")
      .select("alert_type")
      .eq("client_id", client.id)
      .gte("detected_at", sixHoursAgo)
      .is("resolved_at", null);

    const recentAlertTypes = new Set((recentAlerts ?? []).map((a) => a.alert_type));

    // 각 알림 타입 체크
    for (const [alertType, threshold] of Object.entries(THRESHOLDS) as [AlertType, number][]) {
      if (recentAlertTypes.has(alertType)) { skipped++; continue; }

      const metricKeys = METRIC_KEYS[alertType];
      let currentValue: number | null = null;
      let baselineValue: number | null = null;
      let matchedKey: string | null = null;

      for (const key of metricKeys) {
        if (recentByKey[key] !== undefined && baselineByKey[key] !== undefined && baselineByKey[key] > 0) {
          currentValue = recentByKey[key];
          baselineValue = baselineByKey[key];
          matchedKey = key;
          break;
        }
      }

      if (currentValue === null || baselineValue === null) continue;

      const deviation = (currentValue - baselineValue) / baselineValue;

      const isAlert = threshold < 0 ? deviation <= threshold : deviation >= threshold;
      if (!isAlert) continue;

      const deviationPct = Math.round(Math.abs(deviation) * 100);
      const direction = deviation < 0 ? "감소" : "증가";
      const severity = Math.abs(deviation) >= Math.abs(threshold) * 1.5 ? "critical" : "warning";

      const messages: Record<AlertType, string> = {
        impression_drop: `노출이 7일 평균 대비 ${deviationPct}% 감소했습니다. 예산 소진 또는 소재 심사 문제일 수 있습니다.`,
        cpc_spike:       `CPC가 7일 평균 대비 ${deviationPct}% 상승했습니다. 경쟁 심화 또는 타겟 효율 저하를 확인하세요.`,
        roas_drop:       `ROAS가 7일 평균 대비 ${deviationPct}% 하락했습니다. 전환 효율 점검이 필요합니다.`,
        ctr_drop:        `CTR이 7일 평균 대비 ${deviationPct}% 하락했습니다. 소재 피로도일 수 있으니 교체를 검토하세요.`,
        spend_spike:     `광고비가 7일 평균 대비 ${deviationPct}% 급증했습니다. 예산 설정을 확인하세요.`,
      };

      await svc.from("performance_alerts").insert({
        client_id: client.id,
        alert_type: alertType,
        severity,
        title: `[${client.name}] ${ALERT_LABELS[alertType]} ${deviationPct}% ${direction}`,
        message: messages[alertType],
        metric_key: matchedKey,
        current_value: currentValue,
        baseline_value: baselineValue,
        deviation_pct: deviation * 100,
      });

      created++;
    }
  }

  return NextResponse.json({ message: `이상 감지 완료`, created, skipped, clients: clients.length });
}
