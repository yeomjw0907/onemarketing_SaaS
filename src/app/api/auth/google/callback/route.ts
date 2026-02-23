/**
 * Google OAuth 콜백
 * Google Ads + GA4 통합 인증
 */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAdminConfig } from "@/lib/admin-config";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // clientId
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/clients/${state}?tab=integrations&error=${encodeURIComponent(error)}`, req.url),
    );
  }

  if (!code) {
    return NextResponse.json({ error: "code 파라미터 누락" }, { status: 400 });
  }

  const config = await getAdminConfig();
  const baseUrl = config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  try {
    const oauth2Client = new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`,
    );

    // authorization code → tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error("refresh_token을 받지 못했습니다. Google OAuth 동의를 다시 해주세요.");
    }

    const params = new URLSearchParams({
      tab: "integrations",
      googleRefreshToken: tokens.refresh_token,
      googleAccessToken: tokens.access_token || "",
    });

    return NextResponse.redirect(
      new URL(`/admin/clients/${state}?${params.toString()}`, req.url),
    );
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(
        `/admin/clients/${state}?tab=integrations&error=${encodeURIComponent(err.message)}`,
        req.url,
      ),
    );
  }
}
