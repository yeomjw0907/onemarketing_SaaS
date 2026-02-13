import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportsAdmin } from "./reports-admin";

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*, clients(name)")
    .order("published_at", { ascending: false })
    .limit(200);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">리포트 (전체)</h1>
        <p className="text-muted-foreground text-sm mt-1">모든 클라이언트의 리포트를 모아봅니다. 새 리포트 작성은 클라이언트 상세 페이지에서 가능합니다.</p>
      </div>
      <ReportsAdmin initialReports={reports || []} clients={clients || []} />
    </div>
  );
}
