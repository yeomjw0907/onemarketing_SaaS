import type { Metadata } from "next";
import Link from "next/link";
import { Instagram, ArrowRight, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "무료 인스타그램 성과 리포트 | 원마케팅",
  description: "인스타그램 계정을 연결하면 30초 만에 무료 성과 분석 리포트를 받아보세요. 팔로워 증감, 도달률, 인게이지먼트율, AI 진단까지 한 번에.",
};

const FEATURES = [
  { label: "팔로워·도달·노출·인게이지먼트율" },
  { label: "최근 30일 성과 트렌드" },
  { label: "AI 진단 및 개선 포인트" },
];

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "인스타그램 연결이 취소됐어요. 다시 시도해 주세요.",
  no_business_account: "인스타그램 비즈니스 계정이 연결된 Facebook 페이지가 필요합니다.",
  fetch_failed: "데이터를 가져오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
};

export default function FreeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto border-b border-neutral-100">
        <Link href="/" className="text-sm font-bold text-neutral-950 hover:text-neutral-600 transition-colors">
          원마케팅
        </Link>
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
          서비스 소개 →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-20 pb-32">
        {/* 배지 */}
        <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-8">
          Free Instagram Report
        </p>

        {/* 헤드라인 */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-neutral-950 leading-[0.92]">
          내 인스타,
          <br />
          지금 잘 되고
          <br />
          있나요?
        </h1>

        <p className="mt-8 text-lg text-neutral-500 max-w-sm leading-relaxed">
          계정 연결만 하면 <strong className="text-neutral-800">30초</strong> 안에
          팔로워부터 AI 진단까지 무료로 받아보세요.
        </p>

        {/* 에러 배너 */}
        <ErrorBanner searchParams={searchParams} />

        {/* CTA */}
        <div className="mt-10 flex flex-col gap-3 w-fit">
          <Link
            href="/api/free-report/connect"
            className="inline-flex items-center gap-2.5 bg-neutral-950 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-neutral-800 transition-colors"
          >
            <Instagram className="h-4 w-4" />
            인스타그램 연결하고 무료 분석 받기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-neutral-400 pl-1">
            광고 집행 없이 오가닉 계정도 가능 · 완전 무료
          </p>
        </div>

        {/* 포함 내용 */}
        <div className="mt-20 border-t border-neutral-100 pt-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-8">
            리포트에 포함되는 내용
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 flex-shrink-0" />
                <span className="text-base text-neutral-700 font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 신뢰 지표 */}
        <div className="mt-16 flex flex-wrap gap-6 text-sm text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            데이터 저장 안 함
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            2시간 후 자동 삭제
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            언제든 연결 해제 가능
          </span>
        </div>

        {/* 비즈니스 계정 안내 */}
        <div className="mt-12 border-l-2 border-amber-400 pl-5">
          <p className="text-sm font-semibold text-neutral-700 mb-1">비즈니스 계정 필요</p>
          <p className="text-sm text-neutral-500 leading-relaxed">
            인스타그램 → 설정 → 계정 → 전문가 계정으로 전환 후 이용해 주세요.
            Facebook 페이지 연결이 필요합니다.
          </p>
        </div>
      </main>
    </div>
  );
}

async function ErrorBanner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error || !ERROR_MESSAGES[error]) return null;
  return (
    <div className="mt-6 border-l-2 border-red-400 pl-5">
      <p className="text-sm text-red-600">{ERROR_MESSAGES[error]}</p>
    </div>
  );
}
