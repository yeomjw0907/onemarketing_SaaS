/**
 * Meta OAuth 콜백
 * Facebook 로그인 후 access_token을 long-lived token으로 교환
 */
import { NextRequest, NextResponse } from "next/server";
import { exchangeLongLivedToken } from "@/lib/integrations/meta";
import { getAdminConfig } from "@/lib/admin-config";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // clientId가 들어 있음
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
  const appId = config.META_APP_ID;
  const appSecret = config.META_APP_SECRET;
  const redirectUri = `${config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`;

  try {
    // 1. authorization code → short-lived access_token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${appSecret}&code=${code}`,
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error?.message || "토큰 교환 실패");
    }

    // 2. long-lived token 교환
    const longLived = await exchangeLongLivedToken(appId, appSecret, tokenData.access_token);

    // 3. 관리자 페이지로 리다이렉트 (token을 query param으로 전달 → 안전을 위해 한시적으로만)
    const params = new URLSearchParams({
      tab: "integrations",
      metaToken: longLived.accessToken,
      metaExpiresIn: String(longLived.expiresIn),
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
