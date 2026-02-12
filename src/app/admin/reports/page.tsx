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
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">리포트를 업로드하고 관리합니다.</p>
      </div>
      <ReportsAdmin initialReports={reports || []} clients={clients || []} />
    </div>
  );
}
