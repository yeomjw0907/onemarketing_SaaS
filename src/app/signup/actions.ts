"use server";

import { createClient } from "@/lib/supabase/server";

export type CreatePendingProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createPendingProfile(params: {
  displayName: string;
  companyName: string;
  phone?: string;
}): Promise<CreatePendingProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "로그인된 사용자 정보가 없습니다. 다시 로그인해 주세요." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { ok: false, error: "이미 프로필이 등록되어 있습니다." };
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    role: "pending",
    client_id: null,
    display_name: (params.displayName || "").trim(),
    email: user.email,
    company_name: (params.companyName || "").trim() || null,
    phone: (params.phone || "").trim() || null,
    must_change_password: false,
  });

  if (error) {
    return { ok: false, error: error.message || "프로필 등록에 실패했습니다." };
  }
  return { ok: true };
}
