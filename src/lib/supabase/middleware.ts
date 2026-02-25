import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
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

  const pathname = request.nextUrl.pathname;

  // 프로필 조회 헬퍼 — role만 필요하므로 컬럼 명시(스키마 캐시 미반영 시 select("*") 오류 방지)
  async function getProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return data as { role?: string; must_change_password?: boolean } | null;
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
      // 프로필이 없으면 /overview로 보내지 않음 — 서버의 getSession()이 null을 반환해 리다이렉트 루프 발생 방지
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
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
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

  // 토큰 기반 리포트 보기/승인 — 로그인 없이 접근 (페이지 + API)
  if (pathname.startsWith("/report/") || pathname.startsWith("/api/report/")) {
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

  // Admin route protection — 비관리자 리다이렉트 시 OAuth 토큰 등 민감 쿼리 제거 (overview로 가면 토큰 노출 방지)
  if (pathname.startsWith("/admin")) {
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
}
