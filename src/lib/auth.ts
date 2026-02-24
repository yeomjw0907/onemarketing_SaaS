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

  // #region agent log
  await fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
    body: JSON.stringify({
      sessionId: "f446e0",
      location: "auth.ts:getSession-before-profile",
      message: "getSession before profile fetch",
      data: { userId: user.id },
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  // #region agent log
  await fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
    body: JSON.stringify({
      sessionId: "f446e0",
      location: "auth.ts:getSession-after-profile",
      message: "getSession after profile fetch",
      data: { hasProfile: !!profile, errorMsg: profileError?.message ?? null, code: profileError?.code ?? null },
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
  if (!profile) return null;

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
