import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MetricsAdmin } from "./metrics-admin";

export default async function AdminMetricsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: metrics } = await supabase
    .from("metrics")
    .select("*, clients(name)")
    .order("period_start", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metrics 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">KPI 지표 값을 입력합니다.</p>
      </div>
      <MetricsAdmin initialMetrics={metrics || []} clients={clients || []} />
    </div>
  );
}
