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

  // 프로필 조회 헬퍼 (must_change_password 컬럼 없어도 안전)
  async function getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    // #region agent log
    fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
      body: JSON.stringify({
        sessionId: "f446e0",
        location: "middleware.ts:getProfile",
        message: "getProfile result",
        data: { pathname, hasData: !!data, errorMsg: error?.message ?? null, code: error?.code ?? null },
        timestamp: Date.now(),
        hypothesisId: "H3",
      }),
    }).catch(() => {});
    // #endregion
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

      if (profile?.role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
      if (profile?.role === "pending") {
        const url = request.nextUrl.clone();
        url.pathname = "/pending";
        return NextResponse.redirect(url);
      }
      if (profile?.role === "rejected") {
        const url = request.nextUrl.clone();
        url.pathname = "/login?rejected=1";
        return NextResponse.redirect(url);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
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

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      if (profile?.role === "pending") url.pathname = "/pending";
      else if (profile?.role === "rejected") url.pathname = "/login?rejected=1";
      else url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
  }

  // Pending users only on /pending (and /login for logout)
  if (profile?.role === "pending" && pathname !== "/pending" && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/pending";
    return NextResponse.redirect(url);
  }
  if (profile?.role === "rejected" && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login?rejected=1";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
