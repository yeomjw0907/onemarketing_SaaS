import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Profile, Client, EnabledModules } from "@/lib/types/database";

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
  client: Client | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 스키마 캐시에 company_name/phone 미반영 시 select("*") 오류 방지 — 필요한 컬럼만 명시
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("user_id, role, client_id, display_name, email, must_change_password, created_at")
    .eq("user_id", user.id)
    .single();
  if (!profileRow) return null;

  const profile: Profile = {
    ...profileRow,
    company_name: null,
    phone: null,
  };

  let client: Client | null = null;
  if (profile.client_id) {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", profile.client_id)
      .single();
    client = data;
  }

  return {
    id: user.id,
    email: user.email || "",
    profile,
    client,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.profile.role !== "admin") redirect("/overview");
  return session;
}

export async function requireClient(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.profile.role === "pending") redirect("/pending");
  if (session.profile.role === "rejected") redirect("/login?rejected=1");
  if (session.profile.role !== "client") redirect("/admin");
  return session;
}

export function isModuleEnabled(
  modules: EnabledModules | null | undefined,
  moduleName: keyof EnabledModules
): boolean {
  if (!modules) return false;
  return modules[moduleName] === true;
}
