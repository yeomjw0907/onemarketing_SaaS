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
        <h1 className="text-2xl font-bold">Client 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">클라이언트를 생성하고 관리합니다.</p>
      </div>
      <ClientsAdmin initialClients={clients || []} />
    </div>
  );
}
