import Image from "next/image";
import { Section } from "./Section";

export function LandingDashboardPreview() {
  const hasPreviewImage = false; // public/landing/dashboard-preview.png 추가 시 true로 변경
  return (
    <Section id="dashboard-preview" className="scroll-mt-20">
      <div className="text-center space-y-6 md:space-y-8">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          성과·리포트·일정을 한눈에
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          대시보드에서 지표, 리포트, 일정을 확인하고 바로 다음 액션으로 이어가세요.
        </p>
        <div className="relative w-full max-w-4xl mx-auto rounded-lg border border-border bg-muted/30 overflow-hidden aspect-video flex items-center justify-center">
          {hasPreviewImage ? (
            <Image
              src="/landing/dashboard-preview.png"
              alt="개요·성과 지표·리포트·일정을 한눈에 보는 대시보드 화면"
              fill
              className="object-contain p-4"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm px-4">
              대시보드 이미지를 준비 중입니다.
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
