/**
 * 무료 인스타그램 리포트 — OAuth 시작
 * GET /api/free-report/connect
 * → Facebook/Instagram 로그인 페이지로 리다이렉트
 */
import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onemarketing.kr";
  const redirectUri = `${appUrl}/api/free-report/callback`;

  const scope = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId!,
    redirect_uri: redirectUri,
    scope,
    response_type: "code",
    state: "free_report",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  );
}
