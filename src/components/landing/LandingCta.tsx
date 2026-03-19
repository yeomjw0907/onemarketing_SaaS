import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="w-full bg-neutral-950 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-8">
          시작하기
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.95] max-w-3xl">
          마케팅 성과를
          <br />
          투명하게,
          <br />
          <span className="text-neutral-400">지금 바로.</span>
        </h2>
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-neutral-950 text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-neutral-100 transition-colors w-fit"
          >
            무료로 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/free-report"
            className="inline-flex items-center gap-2 border border-neutral-700 text-neutral-300 text-sm font-semibold px-7 py-3.5 rounded-full hover:border-neutral-500 hover:text-white transition-colors w-fit"
          >
            인스타 성과 무료 확인 →
          </Link>
        </div>
      </div>
    </section>
  );
}
