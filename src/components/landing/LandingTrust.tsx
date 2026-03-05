import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "./Section";

const stats = [
  { value: "20+", label: "누적 프로젝트" },
  { value: "9", label: "거래 국가 수" },
  { value: "99%", label: "재계약률" },
];

const portfolio = [
  {
    title: "미국 로스쿨 플랫폼",
    desc: "글로벌 교육 인프라, 플랫폼 개발 및 수강생 모집",
  },
  {
    title: "국민체육진흥공단 (KSPO)",
    desc: "공공기관 검증, 30개 이상 스포츠 기업 DX",
  },
  {
    title: "최상위 대학 창업 프로젝트",
    desc: "성균관대·고려대 3년 연속 무결점 관리",
  },
];

export function LandingTrust() {
  return (
    <Section className="bg-muted/20">
      <div className="text-center space-y-4 mb-10 md:mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          검증된 실적
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          기술로 증명한 4년의 경험. 숫자가 말해줍니다.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12">
        {stats.map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-3xl font-bold text-primary md:text-4xl">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {portfolio.map(({ title, desc }) => (
          <Card key={title} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
