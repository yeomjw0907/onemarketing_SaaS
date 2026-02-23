/**
 * 관리자 연동 기본 설정 조회/저장 (한 번만 세팅하는 키값)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminConfig, setAdminSettings, type AdminConfigKey } from "@/lib/admin-config";

const KEYS: AdminConfigKey[] = [
  "META_APP_ID",
  "META_APP_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_DEVELOPER_TOKEN",
  "NEXT_PUBLIC_APP_URL",
];

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return value.slice(0, 2) + "••••" + value.slice(-2);
}

/** GET: 설정 조회 (시크릿은 클라이언트에 값 전달 안 함, 마스킹만) */
export async function GET() {
  await requireAdmin();
  const config = await getAdminConfig();
  const items: Record<string, { value: string; masked: string }> = {};
  for (const k of KEYS) {
    const v = config[k] ?? "";
    const isSecret = k.includes("SECRET") || k === "GOOGLE_DEVELOPER_TOKEN";
    items[k] = {
      value: isSecret ? "" : v,
      masked: isSecret ? maskSecret(v) : v,
    };
  }
  return NextResponse.json(items);
}

/** PUT: 설정 저장 */
export async function PUT(req: NextRequest) {
  await requireAdmin();
  const body = await req.json();
  const updates: Partial<Record<AdminConfigKey, string>> = {};
  for (const k of KEYS) {
    if (body[k] !== undefined && typeof body[k] === "string") {
      updates[k as AdminConfigKey] = body[k].trim();
    }
  }
  await setAdminSettings(updates);
  return NextResponse.json({ ok: true });
}
