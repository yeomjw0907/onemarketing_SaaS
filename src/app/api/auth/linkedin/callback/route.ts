/**
 * LinkedIn OAuth 콜백
 * code → access_token 교환 → Ad Account 조회 → DB 저장
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const LINKEDIN_API_VERSION = "202502";

function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  // state 디코딩
  let clientId = "";
  try {
    if (stateParam) {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
      clientId = decoded.clientId ?? "";
    }
  } catch {
    return NextResponse.json({ error: "state 파라미터 디코딩 실패" }, { status: 400 });
  }

  const fallbackRedirect = clientId
    ? new URL(`/admin/clients/${clientId}?tab=integrations`, req.url)
    : new URL("/admin/clients", req.url);

  if (error) {
    const errMsg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/admin/clients/${clientId}?tab=integrations&error=${encodeURIComponent(errMsg)}`, req.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/admin/clients/${clientId}?tab=integrations&error=${encodeURIComponent("code 파라미터 누락")}`, req.url),
    );
  }

  if (!clientId) {
    return NextResponse.json({ error: "clientId를 확인할 수 없습니다." }, { status: 400 });
  }

  const linkedInClientId = process.env.LINKEDIN_CLIENT_ID;
  const linkedInClientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!linkedInClientId || !linkedInClientSecret) {
    return NextResponse.redirect(
      new URL(`/admin/clients/${clientId}?tab=integrations&error=${encodeURIComponent("LinkedIn 환경 변수가 설정되지 않았습니다.")}`, req.url),
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`;

  try {
    // 1. authorization code → access_token + refresh_token 교환
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: linkedInClientId,
      client_secret: linkedInClientSecret,
    });

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`토큰 교환 실패 ${tokenRes.status}: ${text}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string | null = tokenData.refresh_token ?? null;
    const expiresIn: number = tokenData.expires_in ?? 5184000;
    const scope: string = tokenData.scope ?? "";
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Ad Accounts 조회
    const accountsRes = await fetch(
      "https://api.linkedin.com/rest/adAccountsV2?q=search&search.status.values[0]=ACTIVE&fields=id,name,status",
      { headers: linkedInHeaders(accessToken) },
    );

    if (!accountsRes.ok) {
      const text = await accountsRes.text();
      throw new Error(`광고 계정 조회 실패 ${accountsRes.status}: ${text}`);
    }

    const accountsData = await accountsRes.json();
    const accounts: Array<{ id: number; name: string; status: string }> = accountsData.elements ?? [];

    if (accounts.length === 0) {
      throw new Error("연결된 LinkedIn 광고 계정이 없습니다. LinkedIn Campaign Manager에서 광고 계정을 생성하세요.");
    }

    // 첫 번째 활성 계정 선택
    const account = accounts[0];
    const adAccountId = String(account.id);
    const adAccountUrn = `urn:li:sponsoredAccount:${adAccountId}`;
    const adAccountName = account.name ?? null;

    const supabase = await createServiceClient();

    // 3. data_integrations upsert
    const credentials = {
      accessToken,
      refreshToken,
      tokenExpiresAt,
      adAccountId,
      adAccountUrn,
      adAccountName,
    };

    const { data: existingIntegration } = await supabase
      .from("data_integrations")
      .select("id")
      .eq("client_id", clientId)
      .eq("platform", "linkedin_ads")
      .maybeSingle();

    let integrationId: string;

    if (existingIntegration) {
      await supabase
        .from("data_integrations")
        .update({
          credentials,
          status: "active",
          error_message: null,
          display_name: `LinkedIn Ads${adAccountName ? ` — ${adAccountName}` : ""}`,
        })
        .eq("id", existingIntegration.id);
      integrationId = existingIntegration.id;
    } else {
      // created_by에 사용할 어드민 user id 조회
      const { data: { user } } = await supabase.auth.getUser();
      const adminUserId = user?.id ?? "system";

      const { data: newInteg, error: integError } = await supabase
        .from("data_integrations")
        .insert({
          client_id: clientId,
          platform: "linkedin_ads",
          display_name: `LinkedIn Ads${adAccountName ? ` — ${adAccountName}` : ""}`,
          credentials,
          config: {},
          status: "active",
          last_synced_at: null,
          error_message: null,
          created_by: adminUserId,
        })
        .select("id")
        .single();

      if (integError || !newInteg) {
        throw new Error(`data_integrations 저장 실패: ${integError?.message}`);
      }
      integrationId = newInteg.id;
    }

    // 4. linkedin_connections upsert
    await supabase
      .from("linkedin_connections")
      .upsert(
        {
          client_id: clientId,
          integration_id: integrationId,
          ad_account_id: adAccountId,
          ad_account_urn: adAccountUrn,
          ad_account_name: adAccountName,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          scope,
        },
        { onConflict: "client_id,ad_account_id" },
      );

    return NextResponse.redirect(
      new URL(`/admin/clients/${clientId}?tab=integrations&linkedin=connected`, req.url),
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      new URL(`/admin/clients/${clientId}?tab=integrations&error=${encodeURIComponent(msg)}`, req.url),
    );
  }
}
