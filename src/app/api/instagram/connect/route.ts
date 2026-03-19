/**
 * Instagram OAuth 연결 시작 (어드민 전용)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onemarketing.kr";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "어드민 권한 필요" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId 파라미터 필요" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "META_APP_ID 환경변수 미설정" }, { status: 500 });
  }

  const state = Buffer.from(JSON.stringify({ clientId })).toString("base64");
  const redirectUri = `${APP_URL}/api/instagram/callback`;

  const oauthUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  oauthUrl.searchParams.set("client_id", appId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set(
    "scope",
    "instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement",
  );
  oauthUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(oauthUrl.toString());
}
