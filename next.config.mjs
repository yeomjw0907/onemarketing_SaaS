import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 워크스페이스 루트를 이 프로젝트 폴더로 고정 ──
  // 상위 폴더에 package-lock.json 등이 있으면 Next.js가 루트를 잘못 추론하므로 명시 지정
  outputFileTracingRoot: __dirname,

  // ── 브라우저에 env 전달 (NEXT_PUBLIC_ 자동 주입의 보험) ──
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
