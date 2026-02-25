import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getAddonItemByKey } from "@/lib/addon-catalog";
import { notifyAddonOrderToAdmin, notifyAddonOrderToClient } from "@/lib/notifications/alimtalk";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.profile.role !== "client") {
    return NextResponse.json({ error: "클라이언트만 신청할 수 있습니다." }, { status: 403 });
  }

  const clientId = session.profile.client_id;
  const userId = session.id;
  if (!clientId) {
    return NextResponse.json({ error: "클라이언트 정보가 없습니다." }, { status: 403 });
  }

  let body: { addon_key?: string; memo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const addonKey = typeof body.addon_key === "string" ? body.addon_key.trim() : "";
  if (!addonKey) {
    return NextResponse.json({ error: "addon_key가 필요합니다." }, { status: 400 });
  }

  const item = getAddonItemByKey(addonKey);
  if (!item) {
    return NextResponse.json({ error: "존재하지 않는 부가 서비스입니다." }, { status: 400 });
  }

  const memo = typeof body.memo === "string" ? body.memo.trim() || null : null;

  const supabase = await createServiceClient();
  const { data: order, error } = await supabase
    .from("addon_orders")
    .insert({
      client_id: clientId,
      addon_key: item.key,
      addon_label: item.label,
      price_won: item.priceWon,
      status: "pending",
      memo,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const adminPhone = process.env.ADMIN_NOTIFY_PHONE?.trim();
  if (adminPhone && order?.id) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
      await notifyAddonOrderToAdmin({
        to: adminPhone,
        clientName: session.client?.name ?? "알 수 없음",
        addonLabel: item.label,
        priceWon: item.priceWon,
        orderId: order.id,
        adminOrdersUrl: baseUrl ? `${baseUrl}/admin/addon-orders` : undefined,
      });
    } catch {
      // 알림톡 실패해도 주문은 성공 처리
    }
  }

  const clientPhone = (session.profile?.phone ?? session.client?.contact_phone ?? "").trim();
  if (clientPhone && order?.id && clientId) {
    try {
      const { createPortalToken } = await import("@/lib/notifications/create-portal-token");
      const { url: orderDetailUrl } = await createPortalToken(supabase, clientId, "overview");
      await notifyAddonOrderToClient({
        phoneNumber: clientPhone,
        clientName: session.client?.name ?? "고객",
        addonLabel: item.label,
        priceWon: item.priceWon,
        orderDetailUrl,
      });
    } catch {
      // 알림톡 실패해도 주문은 성공 처리
    }
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
