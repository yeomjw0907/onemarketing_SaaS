import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { AddonOrdersAdmin } from "./AddonOrdersAdmin";

export const metadata: Metadata = {
  title: "부가서비스 주문 | Onecation 관리자",
  description: "부가 서비스 주문 목록 및 상태 관리",
};

export default async function AdminAddonOrdersPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: orders } = await supabase
    .from("addon_orders")
    .select("id, client_id, addon_key, addon_label, price_won, status, memo, admin_notes, created_at, clients(name)")
    .order("created_at", { ascending: false });

  const rows = (orders ?? []).map((o) => ({
    ...o,
    clients: (o as { clients?: { name: string } | null }).clients ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">부가서비스 주문</h1>
        <p className="text-muted-foreground text-sm mt-1">
          클라이언트가 신청한 부가 서비스 주문을 확인하고 상태를 관리합니다.
        </p>
      </div>
      <AddonOrdersAdmin initialOrders={rows} />
    </div>
  );
}
