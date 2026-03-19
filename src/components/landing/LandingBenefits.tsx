import { Section } from "./Section";

const stats = [
  { number: "3회", label: "매주 자동 보고", sub: "월·수·목 카카오톡" },
  { number: "3+", label: "채널 통합", sub: "Google · Meta · 카카오" },
  { number: "100%", label: "데이터 소유", sub: "샘플링 없는 측정" },
  { number: "0", label: "추가 보고 작업", sub: "자동 발송으로 절약" },
];

export function LandingBenefits() {
  return (
    <Section className="py-16 md:py-20">
      <div className="border-t border-neutral-950 pt-12 md:pt-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-12">
          왜 원마케팅인가
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ number, label, sub }, i) => (
            <div
              key={label}
              className={`py-6 pr-8 ${i < stats.length - 1 ? "border-r border-neutral-200 mr-8" : ""}`}
            >
              <p className="text-5xl md:text-6xl font-black tracking-tighter text-neutral-950 leading-none">
                {number}
              </p>
              <p className="mt-3 text-sm font-semibold text-neutral-700">{label}</p>
              <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
