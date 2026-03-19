/**
 * Instagram OAuth 콜백
 * code → long-lived token 교환 → instagram_accounts upsert
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v21.0";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onemarketing.kr";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !stateB64) {
    return NextResponse.redirect(`${APP_URL}/admin?error=instagram_cancelled`);
  }

  let clientId: string;
  try {
    const stateObj = JSON.parse(Buffer.from(stateB64, "base64").toString("utf-8")) as {
      clientId: string;
    };
    clientId = stateObj.clientId;
  } catch {
    return NextResponse.redirect(`${APP_URL}/admin?error=invalid_state`);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${APP_URL}/api/instagram/callback`;

  try {
    // 1. code → short-lived token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = (await tokenRes.json()) as Record<string, unknown>;

    if (!tokenData.access_token) {
      throw new Error(
        (tokenData.error as Record<string, unknown>)?.message as string ||
          "short-lived 토큰 발급 실패",
      );
    }
    const shortToken = tokenData.access_token as string;

    // 2. short → long-lived token
    const longUrl = new URL(`${GRAPH}/oauth/access_token`);
    longUrl.searchParams.set("grant_type", "fb_exchange_token");
    longUrl.searchParams.set("client_id", appId);
    longUrl.searchParams.set("client_secret", appSecret);
    longUrl.searchParams.set("fb_exchange_token", shortToken);

    const longRes = await fetch(longUrl.toString());
    const longData = (await longRes.json()) as Record<string, unknown>;
    const longToken = (longData.access_token as string) ?? shortToken;
    const expiresIn = Number(longData.expires_in) || 5184000; // 60일 기본값
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Facebook Pages → Instagram Business Account
    const pagesUrl = new URL(`${GRAPH}/me/accounts`);
    pagesUrl.searchParams.set("access_token", longToken);
    pagesUrl.searchParams.set(
      "fields",
      "id,name,instagram_business_account{id,username,followers_count,media_count,profile_picture_url}",
    );

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesData = (await pagesRes.json()) as Record<string, unknown>;
    const pages = (pagesData.data as Record<string, unknown>[]) ?? [];

    let igId: string | null = null;
    let igUsername: string | null = null;
    let igFollowers = 0;
    let igMediaCount = 0;
    let igProfilePicture: string | null = null;
    let pageId: string | null = null;

    for (const page of pages) {
      const iba = page.instagram_business_account as Record<string, unknown> | undefined;
      if (iba?.id) {
        igId = iba.id as string;
        igUsername = (iba.username as string) ?? null;
        igFollowers = Number(iba.followers_count) || 0;
        igMediaCount = Number(iba.media_count) || 0;
        igProfilePicture = (iba.profile_picture_url as string) ?? null;
        pageId = page.id as string;
        break;
      }
    }

    if (!igId) {
      return NextResponse.redirect(
        `${APP_URL}/admin/clients/${clientId}?tab=integrations&error=no_instagram_business_account`,
      );
    }

    // 4. DB upsert
    const svc = await createServiceClient();
    const { error: dbErr } = await svc
      .from("instagram_accounts")
      .upsert(
        {
          client_id: clientId,
          instagram_id: igId,
          username: igUsername,
          page_id: pageId,
          access_token: longToken,
          token_expires_at: tokenExpiresAt,
          followers_count: igFollowers,
          media_count: igMediaCount,
          profile_picture_url: igProfilePicture,
          status: "active",
          error_message: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,instagram_id" },
      );

    if (dbErr) {
      console.error("instagram_accounts upsert error:", dbErr);
      return NextResponse.redirect(
        `${APP_URL}/admin/clients/${clientId}?tab=integrations&error=db_error`,
      );
    }

    return NextResponse.redirect(
      `${APP_URL}/admin/clients/${clientId}?tab=integrations&instagram=connected`,
    );
  } catch (err) {
    console.error("Instagram callback error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      `${APP_URL}/admin/clients/${clientId}?tab=integrations&error=${encodeURIComponent(msg)}`,
    );
  }
}
