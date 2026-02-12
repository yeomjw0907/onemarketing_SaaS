import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssetsAdmin } from "./assets-admin";

export default async function AdminAssetsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assets 관리</h1>
        <p className="text-muted-foreground text-sm mt-1">브랜드 에셋을 관리합니다.</p>
      </div>
      <AssetsAdmin initialAssets={assets || []} clients={clients || []} />
    </div>
  );
}
