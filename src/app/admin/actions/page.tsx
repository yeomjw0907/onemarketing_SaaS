import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActionsAdmin } from "./actions-admin";

export default async function AdminActionsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: actions } = await supabase
    .from("actions")
    .select("*, clients(name)")
    .order("action_date", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Actions 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">마케팅 실행 내역을 관리합니다.</p>
      </div>
      <ActionsAdmin initialActions={actions || []} clients={clients || []} />
    </div>
  );
}
