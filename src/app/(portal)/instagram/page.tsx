import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InstagramDashboard } from "./instagram-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default async function InstagramPage() {
  const session = await requireClient();
  const clientId = session.profile.client_id;

  if (!clientId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">인스타그램 인사이트</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>클라이언트 계정이 아닙니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  // Instagram 계정 조회
  const { data: accounts } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">인스타그램 인사이트</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">연결된 Instagram 계정이 없습니다</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              관리자에게 문의하여 Instagram Business Account를 연결해 주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const account = accounts[0];

  // 최근 30일 stats 기본 로드
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400_000).toISOString().split("T")[0];

  const [statsRes, mediaRes, boostingRes] = await Promise.all([
    supabase
      .from("instagram_daily_stats")
      .select("*")
      .eq("account_id", account.id)
      .gte("stat_date", from)
      .lte("stat_date", to)
      .order("stat_date", { ascending: true }),
    supabase
      .from("instagram_media_metrics")
      .select("*")
      .eq("account_id", account.id)
      .order("posted_at", { ascending: false })
      .limit(20),
    supabase
      .from("boosting_periods")
      .select("*")
      .eq("client_id", clientId)
      .order("start_date", { ascending: false }),
  ]);

  return (
    <InstagramDashboard
      account={account}
      initialStats={statsRes.data ?? []}
      initialMedia={mediaRes.data ?? []}
      initialBoostingPeriods={boostingRes.data ?? []}
      defaultFrom={from}
      defaultTo={to}
    />
  );
}
