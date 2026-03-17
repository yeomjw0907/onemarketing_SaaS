import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/privacy", "/terms", "/data-deletion"] as const;
const AUTH_PATHS = ["/signup", "/login", "/"] as const;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 인증/DB 호출 없이 즉시 통과 (Supabase 장애 시에도 페이지 노출)
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof supabaseResponse.cookies.set>[2] }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 프로필 조회 헬퍼 — role만 필요하므로 컬럼 명시(스키마 캐시 미반영 시 select("*") 오류 방지)
    async function getProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("role, agency_id, must_change_password")
        .eq("user_id", userId)
        .single();
      return data as { role?: string; must_change_password?: boolean; agency_id?: string | null } | null;
    }

    // 에이전시 구독 상태 확인 헬퍼
    async function getSubscriptionStatus(agencyId: string) {
      const { data } = await supabase
        .from("agency_subscriptions")
        .select("status, current_period_end, trial_ends_at")
        .eq("agency_id", agencyId)
        .single();
      return data as { status?: string; current_period_end?: string; trial_ends_at?: string } | null;
    }

    // Public routes (회원가입은 로그인 없이 접근)
    if (pathname === "/signup") {
      if (user) {
        const profile = await getProfile(user.id);
        const url = request.nextUrl.clone();
        if (profile?.role === "admin") url.pathname = "/admin";
        else if (profile?.role === "pending") url.pathname = "/pending";
        else if (profile?.role === "client") url.pathname = "/overview";
        else url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }
    if (pathname === "/login" || pathname === "/") {
      if (user) {
        const profile = await getProfile(user.id);
        if (!profile) {
          return supabaseResponse;
        }
        if (profile.role === "admin") {
          const url = request.nextUrl.clone();
          url.pathname = "/admin";
          return NextResponse.redirect(url);
        }
        if (profile.role === "pending") {
          const url = request.nextUrl.clone();
          url.pathname = "/pending";
          return NextResponse.redirect(url);
        }
        if (profile.role === "rejected") {
          const url = request.nextUrl.clone();
          url.pathname = "/login?rejected=1";
          return NextResponse.redirect(url);
        }
        if (profile.role === "client") {
          const url = request.nextUrl.clone();
          url.pathname = "/overview";
          return NextResponse.redirect(url);
        }
        return supabaseResponse;
      }
      return supabaseResponse;
    }

    // 비밀번호 변경 페이지 — 로그인한 유저만 접근 가능
    if (pathname === "/change-password") {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // 토큰 기반 리포트 보기/승인, 포털 매직링크, 클라이언트 초대, 결제 — 로그인 없이 접근
    if (
      pathname.startsWith("/report/") ||
      pathname.startsWith("/api/report/") ||
      pathname.startsWith("/portal/") ||
      pathname.startsWith("/invite/") ||
      pathname === "/api/payments/webhook" ||
      pathname === "/api/payments/confirm" ||
      pathname === "/api/agency/invite-client/consume" ||
      pathname === "/api/agency/invite-client/accept"
    ) {
      return supabaseResponse;
    }

    // Protected routes
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const profile = await getProfile(user.id);

    // 프로필 없음 — 서버 getSession()이 null이 되어 /login으로 리다이렉트되므로, 미들웨어에서도 /login으로 보냄 (루프 방지)
    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 온보딩 경로 — 로그인된 모든 유저가 접근 가능 (에이전시 설정 전 단계)
    if (pathname.startsWith("/onboarding")) {
      return supabaseResponse;
    }

    // admin 역할이지만 agency_id 없으면 온보딩으로 안내
    if (
      profile.role === "admin" &&
      !profile.agency_id &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/api/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // 비밀번호 변경 강제 — must_change_password가 true이면 /change-password로 리다이렉트
    if (
      profile.must_change_password &&
      pathname !== "/change-password" &&
      !pathname.startsWith("/api/") &&
      pathname !== "/login"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }

    // Admin route protection — 비관리자 리다이렉트 시 OAuth 토큰 등 민감 쿼리 제거 (overview로 가면 토큰 노출 방지)
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin/")) {
      if (profile.role !== "admin") {
        const url = request.nextUrl.clone();
        if (profile.role === "pending") url.pathname = "/pending";
        else if (profile.role === "rejected") url.pathname = "/login?rejected=1";
        else url.pathname = "/overview";
        url.searchParams.delete("metaToken");
        url.searchParams.delete("metaExpiresIn");
        url.searchParams.delete("tab");
        return NextResponse.redirect(url);
      }

      // 에이전시 구독 만료 체크 (admin 역할이지만 에이전시 오너인 경우)
      // 결제 관련 페이지와 API는 항상 허용
      if (
        profile.agency_id &&
        !pathname.startsWith("/admin/billing") &&
        !pathname.startsWith("/api/payments/")
      ) {
        const sub = await getSubscriptionStatus(profile.agency_id);
        if (sub && (sub.status === "expired" || sub.status === "cancelled")) {
          const url = request.nextUrl.clone();
          url.pathname = "/admin/billing";
          url.searchParams.set("expired", "1");
          return NextResponse.redirect(url);
        }
      }
    }

    // 클라이언트 전용 포털 경로: role이 client가 아니면 적절한 곳으로 리다이렉트 (루프 방지)
    const isPortalRoute = ["/overview", "/execution", "/calendar", "/projects", "/reports", "/notices", "/services", "/mypage", "/timeline", "/settings", "/marketing", "/support", "/assets", "/addon"].some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (isPortalRoute && profile.role !== "client") {
      const url = request.nextUrl.clone();
      if (profile.role === "admin") url.pathname = "/admin";
      else if (profile.role === "pending") url.pathname = "/pending";
      else if (profile.role === "rejected") url.pathname = "/login?rejected=1";
      else url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Pending users only on /pending (and /login for logout)
    if (profile.role === "pending" && pathname !== "/pending" && pathname !== "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }
    if (profile.role === "rejected" && pathname !== "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/login?rejected=1";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    // Supabase/env 오류 시에도 회원가입·로그인·랜딩은 노출 (페이지 자체에서 에러 처리 가능)
    if (AUTH_PATHS.some((p) => pathname === p)) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}
