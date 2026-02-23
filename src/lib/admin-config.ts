/**
 * 관리자 연동 기본 설정 (한 번만 세팅하는 키값)
 * DB(admin_settings) 우선, 없으면 process.env 사용
 */
import { createServiceClient } from "@/lib/supabase/server";

const KEY_MAP = {
  META_APP_ID: "meta_app_id",
  META_APP_SECRET: "meta_app_secret",
  GOOGLE_CLIENT_ID: "google_client_id",
  GOOGLE_CLIENT_SECRET: "google_client_secret",
  GOOGLE_DEVELOPER_TOKEN: "google_developer_token",
  NEXT_PUBLIC_APP_URL: "next_public_app_url",
} as const;

export type AdminConfigKey = keyof typeof KEY_MAP;

export interface AdminConfig {
  META_APP_ID: string;
  META_APP_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_DEVELOPER_TOKEN: string;
  NEXT_PUBLIC_APP_URL: string;
}

function envValue(key: AdminConfigKey): string {
  const v = process.env[key];
  return (v ?? "").trim();
}

/** DB에서 admin_settings 조회 (service client 사용, RLS 무시) */
async function getDbSettings(): Promise<Record<string, string>> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("key, value");
  if (error) return {};
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    out[row.key] = (row.value ?? "").trim();
  }
  return out;
}

/** 연동용 설정 반환: DB 우선, 없으면 env */
export async function getAdminConfig(): Promise<AdminConfig> {
  const db = await getDbSettings();
  return {
    META_APP_ID: db[KEY_MAP.META_APP_ID] || envValue("META_APP_ID"),
    META_APP_SECRET: db[KEY_MAP.META_APP_SECRET] || envValue("META_APP_SECRET"),
    GOOGLE_CLIENT_ID: db[KEY_MAP.GOOGLE_CLIENT_ID] || envValue("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: db[KEY_MAP.GOOGLE_CLIENT_SECRET] || envValue("GOOGLE_CLIENT_SECRET"),
    GOOGLE_DEVELOPER_TOKEN: db[KEY_MAP.GOOGLE_DEVELOPER_TOKEN] || envValue("GOOGLE_DEVELOPER_TOKEN"),
    NEXT_PUBLIC_APP_URL: db[KEY_MAP.NEXT_PUBLIC_APP_URL] || envValue("NEXT_PUBLIC_APP_URL"),
  };
}

/** OAuth URL용 공개 키만 (클라이언트에 전달용) */
export async function getAdminOAuthPublicKeys(): Promise<{
  metaAppId: string | null;
  googleClientId: string | null;
  nextPublicAppUrl: string | null;
}> {
  const c = await getAdminConfig();
  return {
    metaAppId: c.META_APP_ID || null,
    googleClientId: c.GOOGLE_CLIENT_ID || null,
    nextPublicAppUrl: c.NEXT_PUBLIC_APP_URL || null,
  };
}

/** 설정 저장 (API에서 호출) */
export async function setAdminSettings(updates: Partial<Record<AdminConfigKey, string>>): Promise<void> {
  const supabase = await createServiceClient();
  const now = new Date().toISOString();
  for (const [envKey, value] of Object.entries(updates)) {
    const key = KEY_MAP[envKey as AdminConfigKey];
    if (!key || value === undefined) continue;
    await supabase.from("admin_settings").upsert(
      { key, value: (value ?? "").trim(), updated_at: now },
      { onConflict: "key" }
    );
  }
}
