import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

function ensureEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. " +
        "프로젝트 루트(원마케팅SaaS)의 .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 " +
        "개발 서버를 재시작하세요. (Ctrl+C 후 npm run dev)"
    );
  }
}

export async function createClient() {
  ensureEnv();
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  ensureEnv();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다. 설정 후 개발 서버를 재시작하세요."
    );
  }
  // service role은 쿠키 기반 SSR 클라이언트가 아닌 raw 클라이언트 사용
  // (SSR createServerClient + serviceKey 조합 시 쿠키 세션과 충돌)
  return createRawClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
