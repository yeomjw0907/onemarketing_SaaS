import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientsAdmin } from "./clients-admin";

export default async function AdminClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">클라이언트 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">
          클라이언트를 추가하고, 클릭하면 상세 설정(KPI·지표·실행항목 등)을 관리할 수 있습니다.
        </p>
      </div>
      <ClientsAdmin initialClients={clients || []} />
    </div>
  );
}
