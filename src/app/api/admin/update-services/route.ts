import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/update-services
 * Service Role로 enabled_services 업데이트 (RLS 우회)
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { clientId, enabledServices, serviceUrls } = await request.json();

    if (!clientId || typeof enabledServices !== "object") {
      return NextResponse.json({ error: "clientId와 enabledServices가 필요합니다." }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const payload: { enabled_services: Record<string, boolean>; service_urls?: Record<string, string> } = {
      enabled_services: enabledServices,
    };
    if (serviceUrls != null && typeof serviceUrls === "object") {
      payload.service_urls = serviceUrls;
    }
    const { error } = await serviceClient
      .from("clients")
      .update(payload)
      .eq("id", clientId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "서비스 설정이 저장되었습니다." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "서버 오류" }, { status: 500 });
  }
}
