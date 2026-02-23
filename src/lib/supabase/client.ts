import { createBrowserClient } from "@supabase/ssr";

// ── 환경변수 로드 (trim으로 공백/개행 제거) ──
// next.config.mjs에서 loadEnvConfig로 프로젝트 루트 .env.local을 명시 로드하므로,
// 다른 폴더에서 dev 실행해도 클라이언트 번들에 값이 들어감
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

// ── 디버그: 브라우저에서 env 값 확인용 (문제 해결 후 삭제 가능) ──
if (typeof window !== "undefined") {
  console.log("[Supabase Debug] URL loaded:", supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : "(empty)");
  console.log("[Supabase Debug] Key loaded:", supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : "(empty)");
}

// ── placeholder / 미설정 감지 ──
const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project") ||
  supabaseUrl.includes("xxxx") ||
  supabaseAnonKey === "your-anon-key";

if (typeof window !== "undefined" && isPlaceholder) {
  console.error(
    "[Supabase] 환경변수가 비어 있습니다. 아래를 확인하세요:\n" +
    "1. .env.local 파일이 프로젝트 루트(원마케팅SaaS/)에 있는지\n" +
    "2. 상위 폴더에 stray package-lock.json 이 없는지\n" +
    "3. dev 서버를 재시작했는지 (Ctrl+C → npm run dev)"
  );
}

/** 브라우저에서 Supabase API 호출 가능 여부 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholder);
}

export function createClient() {
  // 빌드 시(prerender) env가 없을 수 있음. 빈 값이면 placeholder 전달해 생성만 하고,
  // 실제 사용 시 isSupabaseConfigured()로 체크하도록 함.
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseAnonKey || "placeholder-anon-key";
  return createBrowserClient(url, key);
}
