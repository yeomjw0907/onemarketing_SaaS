/**
 * GET /api/cron/check-subscriptions
 * 구독 만료 처리 Cron (매일 실행)
 * - 만료된 trialing/active 구독 → expired 로 변경
 * - 만료 3일 전 에이전시 오너에게 알림톡 발송
 *
 * Vercel Cron은 GET 요청을 보냄. vercel.json: "0 1 * * *" (UTC 01:00 = KST 10:00)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifySubscriptionExpiry } from "@/lib/notifications/alimtalk";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  // Cron 시크릿 검증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  let expired = 0;
  let warned = 0;
  let warnErrors = 0;

  // 1. 만료된 구독 → expired 처리
  const { data: expiredSubs, error: expiredError } = await supabase
    .from("agency_subscriptions")
    .update({ status: "expired" })
    .in("status", ["trialing", "active"])
    .lt("current_period_end", now.toISOString())
    .select("agency_id, plan_key");

  if (!expiredError && expiredSubs) {
    expired = expiredSubs.length;
  }

  // 2. 3일 후 만료 예정 구독 → 에이전시 오너에게 알림톡
  const { data: soonExpiring } = await supabase
    .from("agency_subscriptions")
    .select("agency_id, plan_key, current_period_end")
    .in("status", ["trialing", "active"])
    .gte("current_period_end", now.toISOString())
    .lte("current_period_end", threeDaysLater.toISOString());

  if (soonExpiring && soonExpiring.length > 0) {
    // 에이전시 정보와 오너 프로필(전화번호) 조회
    const agencyIds = soonExpiring.map((s) => s.agency_id);

    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, name, owner_user_id")
      .in("id", agencyIds);

    if (agencies && agencies.length > 0) {
      const ownerIds = agencies.map((a) => a.owner_user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, phone, display_name")
        .in("user_id", ownerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      const agencyMap = new Map(agencies.map((a) => [a.id, a]));
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

      for (const sub of soonExpiring) {
        const agency = agencyMap.get(sub.agency_id);
        if (!agency) continue;

        const profile = profileMap.get(agency.owner_user_id);
        if (!profile?.phone) continue; // 전화번호 없으면 스킵

        const expiryDate = new Date(sub.current_period_end);
        const daysLeft = Math.max(
          1,
          Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        const expiryDateStr = format(expiryDate, "yyyy년 M월 d일", { locale: ko });

        try {
          const result = await notifySubscriptionExpiry({
            phoneNumber: profile.phone,
            agencyName: agency.name,
            expiryDate: expiryDateStr,
            daysLeft,
            billingUrl: `${appUrl}/admin/billing`,
          });

          if (result.success) {
            warned++;
          } else {
            warnErrors++;
            console.warn(`[cron/check-subscriptions] 알림 실패 agency=${sub.agency_id}: ${result.error}`);
          }
        } catch (err) {
          warnErrors++;
          console.error(`[cron/check-subscriptions] 알림 오류 agency=${sub.agency_id}:`, err);
        }
      }
    }
  }

  console.log(`[cron/check-subscriptions] expired=${expired}, warned=${warned}, warnErrors=${warnErrors}`);
  return NextResponse.json({ expired, warned, warnErrors });
}
