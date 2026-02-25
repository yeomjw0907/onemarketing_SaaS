"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyWelcome } from "@/lib/notifications/alimtalk";
import { createPortalToken } from "@/lib/notifications/create-portal-token";

const DEFAULT_ENABLED_MODULES = {
  overview: true,
  execution: true,
  calendar: true,
  projects: true,
  reports: true,
  assets: true,
  support: true,
  timeline: true,
};

export type ApproveResult = { ok: true; error?: never } | { ok: false; error: string };
export type RejectResult = { ok: true; error?: never } | { ok: false; error: string };

/** clientId가 있으면 기존 클라이언트에 연결, 없으면 새 클라이언트 생성 후 연결 */
export async function approveSignup(
  userId: string,
  clientId: string | null,
  profile: { display_name: string; email: string; company_name: string | null; phone: string | null }
): Promise<ApproveResult> {
  const supabase = await createServiceClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("user_id", userId)
    .single();

  if (!existingProfile || existingProfile.role !== "pending") {
    return { ok: false, error: "해당 사용자를 찾을 수 없거나 이미 처리되었습니다." };
  }

  let targetClientId = clientId;

  if (!targetClientId) {
    const code = `C${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const { data: newClient, error: createErr } = await supabase
      .from("clients")
      .insert({
        name: (profile.company_name || profile.display_name || "신규 클라이언트").trim(),
        client_code: code,
        contact_name: profile.display_name || null,
        contact_phone: profile.phone || null,
        contact_email: profile.email || null,
        enabled_modules: DEFAULT_ENABLED_MODULES,
        enabled_services: {},
        is_active: true,
      })
      .select("id")
      .single();

    if (createErr || !newClient) {
      return { ok: false, error: createErr?.message || "클라이언트 생성에 실패했습니다." };
    }
    targetClientId = newClient.id;
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ role: "client", client_id: targetClientId })
    .eq("user_id", userId);

  if (updateErr) {
    return { ok: false, error: updateErr.message || "승인 처리에 실패했습니다." };
  }

  if (profile.phone && targetClientId) {
    try {
      const { url: dashboardUrl } = await createPortalToken(supabase, targetClientId, "overview");
      await notifyWelcome({
        phoneNumber: profile.phone,
        clientName: profile.display_name || profile.company_name || "고객",
        dashboardUrl,
      });
    } catch {
      // 알림톡 실패해도 승인은 성공 처리
    }
  }

  revalidatePath("/admin/signups");
  revalidatePath("/admin/clients");
  return { ok: true };
}

export async function rejectSignup(userId: string): Promise<RejectResult> {
  const supabase = await createServiceClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (!existingProfile || existingProfile.role !== "pending") {
    return { ok: false, error: "해당 사용자를 찾을 수 없거나 이미 처리되었습니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "rejected" })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message || "거절 처리에 실패했습니다." };
  }

  revalidatePath("/admin/signups");
  return { ok: true };
}
