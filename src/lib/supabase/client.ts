import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// placeholder 사용 시 연결 불가 (캐시 시 유의)
const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project") ||
  supabaseUrl.includes("xxxx") ||
  supabaseAnonKey === "your-anon-key";

if (typeof window !== "undefined" && isPlaceholder) {
  console.error(
    "[Supabase] .env.local에 실제 Supabase URL과 Anon Key를 넣은 뒤, .next 폴더를 삭제하고 개발 서버를 다시 실행하세요."
  );
}

/** 브라우저에서 Supabase API 호출 가능 여부 (env 로드됐는지) */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !isPlaceholder);
}

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
