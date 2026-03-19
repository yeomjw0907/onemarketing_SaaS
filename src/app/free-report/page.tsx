import type { Metadata } from "next";
import Link from "next/link";
import { Instagram, BarChart2, TrendingUp, Zap, ChevronRight, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "무료 인스타그램 성과 리포트 | 원마케팅",
  description: "인스타그램 계정을 연결하면 30초 만에 무료 성과 분석 리포트를 받아보세요. 팔로워 증감, 도달률, 인게이지먼트율, AI 진단까지 한 번에.",
};

const FEATURES = [
  { icon: BarChart2, title: "핵심 지표 분석", desc: "팔로워·도달·노출·인게이지먼트율을 한눈에" },
  { icon: TrendingUp, title: "최근 30일 트렌드", desc: "성과가 올라가고 있는지 한눈에 확인" },
  { icon: Zap,       title: "AI 진단 코멘트", desc: "현재 상태와 개선 포인트를 AI가 분석" },
];

const ERROR_MESSAGES: Record<string, string> = {
  cancelled:           "인스타그램 연결이 취소됐어요. 다시 시도해 주세요.",
  no_business_account: "인스타그램 비즈니스 계정이 연결된 Facebook 페이지가 필요합니다.",
  fetch_failed:        "데이터를 가져오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
};

export default function FreeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <span className="font-bold text-lg tracking-tight">원마케팅</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          서비스 소개 →
        </Link>
      </header>

      {/* 히어로 */}
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
        {/* 배지 */}
        <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5 text-sm text-pink-300 mb-8">
          <Instagram className="h-3.5 w-3.5" />
          인스타그램 무료 성과 분석
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          내 인스타그램,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
            지금 잘 되고 있나요?
          </span>
        </h1>

        <p className="text-lg text-white/60 mb-10 leading-relaxed">
          인스타그램 계정을 연결하면 <strong className="text-white">30초 만에</strong><br className="hidden sm:block" />
          팔로워 분석부터 AI 진단까지 무료로 받아보세요.
        </p>

        {/* 에러 메시지 */}
        <ErrorBanner searchParams={searchParams} />

        {/* CTA 버튼 */}
        <Link
          href="/api/free-report/connect"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white font-semibold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-pink-500/20 transition-all hover:shadow-pink-500/30 hover:scale-105 active:scale-100"
        >
          <Instagram className="h-5 w-5" />
          인스타그램 연결하고 무료 분석 받기
          <ChevronRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-sm text-white/30">
          광고 집행 없이 오가닉 계정만 있어도 됩니다 · 완전 무료
        </p>

        {/* 기능 카드 */}
        <div className="grid sm:grid-cols-3 gap-4 mt-20">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-pink-300" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-white/50">{desc}</p>
            </div>
          ))}
        </div>

        {/* 신뢰 지표 */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-sm text-white/30 mb-6">원마케팅이 운영하는 무료 분석 툴입니다</p>
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-white/40">
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />데이터 저장 안 함</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />광고 게시 없음</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />언제든 연결 해제 가능</span>
          </div>
        </div>

        {/* 비즈니스 계정 안내 */}
        <div className="mt-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-left">
          <p className="text-sm text-amber-300 font-medium mb-1">📌 비즈니스 계정이 필요합니다</p>
          <p className="text-sm text-white/50">
            인스타그램 → 설정 → 계정 → 전문가 계정으로 전환에서 비즈니스 계정으로 변경 후 이용해 주세요.
            Facebook 페이지와 연결이 필요합니다.
          </p>
        </div>
      </main>
    </div>
  );
}

// 에러 배너 (서버 컴포넌트 async)
async function ErrorBanner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error || !ERROR_MESSAGES[error]) return null;
  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
      {ERROR_MESSAGES[error]}
    </div>
  );
}
