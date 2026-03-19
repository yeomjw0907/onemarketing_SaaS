import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Unplug } from "lucide-react";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "통합 분석 | Onecation",
  description: "Meta 광고 + GA4 통합 성과 분석",
};

export default async function AnalyticsPage() {
  const session = await requireClient();
  const clientId = session.profile.client_id;

  if (!clientId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">통합 분석</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Unplug className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>클라이언트 계정이 아닙니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  // GA4 integration 존재 여부 확인
  const { data: ga4Integration } = await supabase
    .from("data_integrations")
    .select("id, display_name, last_synced_at")
    .eq("client_id", clientId)
    .eq("platform", "google_analytics")
    .eq("status", "active")
    .maybeSingle();

  if (!ga4Integration) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">통합 분석</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <Unplug className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">GA4 미연동</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              관리자에게 문의하여 Google Analytics 4 (GA4)를 연결해 주세요.
              <br />
              연동 후 Meta 광고 클릭수와 GA4 세션 데이터를 함께 확인할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AnalyticsDashboard />;
}
