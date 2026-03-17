import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarketingDashboard } from "./marketing-dashboard";

export const metadata: Metadata = {
  title: "광고 성과 | Onecation",
  description: "광고·트래픽 성과 대시보드",
};

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    cFrom?: string;
    cTo?: string;
    compare?: string; // "false" 이면 비교 OFF
    platform?: string;
  }>;
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default async function MarketingPage({ searchParams }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.client_id) redirect("/login");

  const sp = await searchParams;

  // ── 기본 기간: 최근 30일 ──
  const today = toDateStr(new Date());
  const defaultFrom = toDateStr(new Date(Date.now() - 30 * 86400000));

  const dateFrom = sp.from || defaultFrom;
  const dateTo   = sp.to   || today;

  // ── 비교 기간: 기본 = 직전 동일 길이 ──
  const compareEnabled = sp.compare !== "false";
  const periodMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime() + 86400000;
  const autoCompareFrom = toDateStr(new Date(new Date(dateFrom).getTime() - periodMs));
  const autoCompareTo   = toDateStr(new Date(new Date(dateTo).getTime()   - periodMs));

  const compareFrom = compareEnabled ? (sp.cFrom || autoCompareFrom) : null;
  const compareTo   = compareEnabled ? (sp.cTo   || autoCompareTo)   : null;

  // ── 클라이언트 연동 목록 ──
  const { data: integrations } = await supabase
    .from("data_integrations")
    .select("id, platform, display_name, status, last_synced_at")
    .eq("client_id", profile.client_id)
    .eq("status", "active");

  // ── 현재 기간 지표 ──
  const { data: metrics } = await supabase
    .from("platform_metrics")
    .select("*")
    .eq("client_id", profile.client_id)
    .gte("metric_date", dateFrom)
    .lte("metric_date", dateTo)
    .order("metric_date", { ascending: true });

  // ── 비교 기간 지표 ──
  let compareMetrics: typeof metrics = null;
  if (compareEnabled && compareFrom && compareTo) {
    const { data } = await supabase
      .from("platform_metrics")
      .select("*")
      .eq("client_id", profile.client_id)
      .gte("metric_date", compareFrom)
      .lte("metric_date", compareTo)
      .order("metric_date", { ascending: true });
    compareMetrics = data;
  }

  return (
    <MarketingDashboard
      integrations={integrations || []}
      metrics={metrics || []}
      compareMetrics={compareMetrics || []}
      dateFrom={dateFrom}
      dateTo={dateTo}
      compareFrom={compareFrom}
      compareTo={compareTo}
      compareEnabled={compareEnabled}
      selectedPlatform={sp.platform || "all"}
    />
  );
}
