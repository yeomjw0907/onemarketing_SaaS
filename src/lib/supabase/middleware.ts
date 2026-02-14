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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data as { role?: string; must_change_password?: boolean } | null;
  }

  // Public routes
  if (pathname === "/login" || pathname === "/") {
    if (user) {
      const profile = await getProfile(user.id);

      if (profile?.role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      } else {
        const url = request.nextUrl.clone();
        url.pathname = "/overview";
        return NextResponse.redirect(url);
      }
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
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
