import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KpisAdmin } from "./kpis-admin";

export default async function AdminKpisPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: kpis } = await supabase
    .from("kpi_definitions")
    .select("*, clients(name)")
    .order("client_id")
    .order("overview_order");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KPI 정의 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          클라이언트별 KPI 지표를 정의합니다.
        </p>
      </div>
      <KpisAdmin initialKpis={kpis || []} clients={clients || []} />
    </div>
  );
}
