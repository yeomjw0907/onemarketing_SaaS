/**
 * OAuth용 공개 키 (Meta App ID, Google Client ID) — 클라이언트에서 프롬프트 없이 OAuth URL 생성용
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminOAuthPublicKeys } from "@/lib/admin-config";

export async function GET() {
  await requireAdmin();
  const keys = await getAdminOAuthPublicKeys();
  return NextResponse.json(keys);
}
