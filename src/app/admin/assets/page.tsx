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
    .limit(200);

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, client_code")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">자료실 (전체)</h1>
        <p className="text-muted-foreground text-sm mt-1">모든 클라이언트의 브랜드 에셋을 모아봅니다.</p>
      </div>
      <AssetsAdmin initialAssets={assets || []} clients={clients || []} />
    </div>
  );
}
