import { Section } from "./Section";

const benefits = [
  {
    index: "01",
    title: "올인원 기능",
    description:
      "매주 3회 카카오 정기 보고, 다채널 대시보드, 주간·월간 리포트 발행·알림, 실행·일정·프로젝트 진척도 관리까지 한곳에서 제공합니다.",
  },
  {
    index: "02",
    title: "맞춤형 컨설팅",
    description:
      "비즈니스 규모와 목표에 맞는 KPI 설계와 데이터 기반 최적화 방안을 제안합니다.",
  },
  {
    index: "03",
    title: "정확한 데이터",
    description:
      "자체 추적과 실시간 DB로 샘플링 없이 100% 정확한 데이터를 확보하고, 투명한 성과 측정이 가능합니다.",
  },
];

export function LandingBenefits() {
  return (
    <Section>
      <div className="space-y-3 mb-12 md:mb-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          이렇게 다릅니다
        </h2>
        <p className="text-muted-foreground max-w-xl">
          원케이션이 설계·구현한 마케팅 인프라로 성장을 가속화합니다.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
        {benefits.map(({ index, title, description }) => (
          <div key={title} className="flex flex-col gap-3">
            <span className="text-4xl font-bold text-primary/20 tabular-nums leading-none">{index}</span>
            <h3 className="text-lg font-semibold mt-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
