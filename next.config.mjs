import { fileURLToPath } from "node:url";
import path from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 프로젝트 폴더(원마케팅SaaS)에서 .env.local 명시 로드 ──
// 다른 폴더에서 npm run dev 해도 여기서 로드한 값이 빌드/클라이언트에 반영됨
loadEnvConfig(__dirname, true);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 워크스페이스 루트를 이 프로젝트 폴더로 고정 ──
  // 상위 폴더에 package-lock.json 등이 있으면 Next.js가 루트를 잘못 추론하므로 명시 지정
  outputFileTracingRoot: __dirname,

  // ── 브라우저에 env 전달 (값이 있을 때만 설정해 undefined로 덮어쓰지 않음) ──
  env: {
    ...(supabaseUrl && { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl }),
    ...(supabaseAnonKey && { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey }),
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
