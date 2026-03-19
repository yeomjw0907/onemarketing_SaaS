import Link from "next/link";
import { Instagram, ArrowRight } from "lucide-react";
import { Section } from "./Section";

export function LandingHero() {
  return (
    <section className="w-full bg-white border-b border-neutral-100">
      <Section className="py-20 md:py-28 lg:py-36">
        {/* 상단 배지 */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-neutral-400">
            <span className="inline-block w-4 h-px bg-neutral-300" />
            Marketing SaaS for Agencies
          </span>
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-neutral-950 leading-[0.92] max-w-4xl">
          광고주가
          <br />
          직접 보는
          <br />
          <span className="text-primary">마케팅 관리</span>
        </h1>

        {/* 서브카피 + CTA 행 */}
        <div className="mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-end gap-8 sm:gap-16">
          <p className="text-lg text-neutral-500 max-w-xs leading-relaxed">
            Google · Meta · 카카오 성과를 한 화면에.
            <br />
            매주 3회 알림톡으로 자동 보고.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-neutral-950 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors w-fit"
            >
              지금 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/free-report"
              className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors w-fit"
            >
              <Instagram className="h-3.5 w-3.5" />
              인스타 성과 먼저 무료로 확인 →
            </Link>
          </div>
        </div>
      </Section>
    </section>
  );
}
