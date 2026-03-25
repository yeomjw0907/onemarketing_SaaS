/**
 * 연동 연결 테스트 API
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { testNaverConnection } from "@/lib/integrations/naver";
import { testMetaConnection } from "@/lib/integrations/meta";
import { testGoogleAdsConnection } from "@/lib/integrations/google-ads";
import { testGA4Connection } from "@/lib/integrations/ga4";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (session.profile.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { platform, credentials } = await req.json();

  if (!platform || !credentials) {
    return NextResponse.json({ error: "platform, credentials 필수" }, { status: 400 });
  }

  try {
    let success = false;

    switch (platform) {
      case "naver_ads":
      case "naver_searchad":
        success = await testNaverConnection(credentials);
        break;
      case "meta_ads":
        success = await testMetaConnection(credentials);
        break;
      case "google_ads":
        success = await testGoogleAdsConnection(credentials);
        break;
      case "google_analytics":
        success = await testGA4Connection(credentials);
        break;
      default:
        return NextResponse.json({ error: `지원하지 않는 플랫폼: ${platform}` }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 200 },
    );
  }
}
