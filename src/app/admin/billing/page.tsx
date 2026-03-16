import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BillingClient from "./billing-client";

export const metadata = { title: "구독 관리" };

export default async function BillingPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  // 에이전시 정보 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("user_id", session.id)
    .single();

  let agency = null;
  let subscription = null;
  let plan = null;

  if (profile?.agency_id) {
    const { data: agencyData } = await supabase
      .from("agencies")
      .select("*")
      .eq("id", profile.agency_id)
      .single();
    agency = agencyData;

    const { data: subData } = await supabase
      .from("agency_subscriptions")
      .select("*")
      .eq("agency_id", profile.agency_id)
      .single();
    subscription = subData;

    if (subscription?.plan_key) {
      const { data: planData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("plan_key", subscription.plan_key)
        .single();
      plan = planData;
    }
  }

  return (
    <Suspense>
      <BillingClient
        agency={agency}
        subscription={subscription}
        plan={plan}
      />
    </Suspense>
  );
}
