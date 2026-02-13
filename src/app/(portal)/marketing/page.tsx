import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MarketingDashboard } from "./marketing-dashboard";

export const metadata: Metadata = {
  title: "마케팅 성과 | Onecation",
  description: "광고·트래픽 성과 대시보드",
};

export default async function MarketingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.client_id) redirect("/login");

  // 클라이언트의 연동 목록
  const { data: integrations } = await supabase
    .from("data_integrations")
    .select("id, platform, display_name, status, last_synced_at")
    .eq("client_id", profile.client_id)
    .eq("status", "active");

  // 최근 30일 지표 데이터
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: metrics } = await supabase
    .from("platform_metrics")
    .select("*")
    .eq("client_id", profile.client_id)
    .gte("metric_date", thirtyDaysAgo)
    .lte("metric_date", today)
    .order("metric_date", { ascending: true });

  return (
    <MarketingDashboard
      integrations={integrations || []}
      metrics={metrics || []}
      dateFrom={thirtyDaysAgo}
      dateTo={today}
    />
  );
}
