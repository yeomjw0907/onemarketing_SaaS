import { CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section } from "./Section";

const benefits = [
  {
    icon: CheckCircle2,
    title: "올인원 기능",
    description:
      "매주 3회 카카오 정기 보고, 다채널 대시보드, 주간·월간 리포트 발행·알림, 실행·일정·프로젝트 진척도 관리까지 한곳에서 제공합니다.",
  },
  {
    icon: FileText,
    title: "맞춤형 컨설팅",
    description:
      "비즈니스 규모와 목표에 맞는 KPI 설계와 데이터 기반 최적화 방안을 제안합니다.",
  },
  {
    icon: TrendingUp,
    title: "정확한 데이터",
    description:
      "자체 추적과 실시간 DB로 샘플링 없이 100% 정확한 데이터를 확보하고, 투명한 성과 측정이 가능합니다.",
  },
];

export function LandingBenefits() {
  return (
    <Section>
      <div className="text-center space-y-4 mb-10 md:mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          이렇게 다릅니다
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          원케이션이 설계·구현한 마케팅 인프라로 성장을 가속화합니다.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border-border bg-card text-center">
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                <Icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
