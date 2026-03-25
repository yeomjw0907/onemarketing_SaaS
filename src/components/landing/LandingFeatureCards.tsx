"use client";

import { useState } from "react";
import {
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  FileText,
  ListTodo,
  Bell,
  FolderKanban,
  ChevronRight,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Section } from "./Section";

const features = [
  {
    icon: LayoutDashboard,
    title: "다채널 광고 성과",
    description: "Google Ads, GA4, Meta 연동 성과를 한 대시보드에서 조회할 수 있습니다.",
    detail: "Google Ads, Google Analytics(GA4), Meta(페이스북·인스타) 등 여러 채널의 광고·분석 데이터를 하나의 대시보드에 연동해 조회합니다. 채널별로 로그인할 필요 없이, 연동만 하면 성과 지표를 한눈에 비교·확인할 수 있어 의사결정이 빨라집니다. 원케이션이 직접 구축한 인프라로 데이터 100% 소유와 투명한 성과 측정을 제공합니다.",
  },
  {
    icon: MessageSquare,
    title: "카카오톡 매주 3회 정기 보고",
    description:
      "월요일 지난주 리뷰, 수요일 예산 페이싱, 목요일 다음 주 제안을 카카오톡으로 자동 발송합니다.",
    detail: "매주 월·수·목요일에 맞춰 카카오톡으로 자동 발송되는 정기 보고입니다. 월요일에는 지난주 성과 리뷰, 수요일에는 예산 페이싱 현황, 목요일에는 다음 주 제안을 담아 담당자에게 전달합니다. 별도 요약 작업 없이 설정만 해두면 되며, 고객사와의 소통을 일정하게 유지하는 데 도움이 됩니다.",
  },
  {
    icon: FileText,
    title: "주간·월간 성과 리포트",
    description: "주간/월간 리포트를 작성·발행하고, 발행 시 고객에게 카카오톡으로 안내합니다.",
    detail: "주간·월간 단위로 성과 리포트를 작성하고, 한 번에 발행할 수 있습니다. 발행 시 연동된 고객에게 카카오톡으로 안내가 가므로 수동으로 공유할 필요가 없습니다. 템플릿과 지표를 활용해 일관된 형식의 리포트를 빠르게 만들 수 있고, 이력 관리도 함께 됩니다.",
  },
  {
    icon: ListTodo,
    title: "실행 현황·일정 관리",
    description:
      "실행 항목(작업)과 캘린더 일정을 관리하고, 상태 변경·일정 리마인더 시 알림톡을 보냅니다.",
    detail: "마케팅 실행 항목(태스크)과 캘린더 일정을 한곳에서 관리합니다. 항목별로 상태(진행 중, 완료 등)를 변경할 수 있고, 일정 리마인더가 설정된 시점에 카카오톡 알림이 발송됩니다. 상태 변경 시에도 알림을 보내 업데이트를 실시간으로 공유할 수 있어, 팀·고객사와의 정합성을 유지하기 좋습니다.",
  },
  {
    icon: BarChart3,
    title: "KPI·성과 대시보드",
    description: "방문자 수, 리드, 전환율, 광고비 등 KPI 카드와 성과 차트로 한눈에 확인합니다.",
    detail: "방문자 수, 리드 수, 전환율, 광고비 등 핵심 KPI를 카드와 차트로 한 화면에 모아 둡니다. 기간·채널별로 필터링해 보거나, 목표 대비 달성률을 확인할 수 있어, 주간·월간 보고와 전략 수정에 바로 활용할 수 있습니다. 데이터는 자체 추적·DB 기반으로 샘플링 없이 투명하게 제공됩니다.",
  },
  {
    icon: Bell,
    title: "리포트·상태 변경 알림",
    description: "리포트 발행 시, 실행 항목 상태 변경 시 카카오톡으로 즉시 안내합니다.",
    detail: "주간·월간 리포트가 발행되면, 또는 실행 항목의 상태가 변경되면 카카오톡으로 즉시 알림을 보냅니다. 담당자가 별도로 확인하지 않아도 중요한 이벤트를 놓치지 않고, 고객사와의 신뢰와 소통을 유지하는 데 도움이 됩니다. 알림 수신 대상과 조건은 서비스 내에서 설정할 수 있습니다.",
  },
  {
    icon: FolderKanban,
    title: "마케팅 프로젝트 진척도 관리",
    description:
      "프로젝트별 진행 단계(stage)와 진척률(%)로 마케팅 프로젝트를 한눈에 관리할 수 있습니다.",
    detail: "마케팅 프로젝트를 단계(stage)와 진척률(%)로 한눈에 관리합니다. 프로젝트별로 현재 단계와 진행률을 설정·갱신할 수 있어, 여러 프로젝트를 동시에 운영할 때도 우선순위와 현황을 쉽게 파악할 수 있습니다. 대시보드와 리포트에 반영되어, 고객사 보고나 내부 점검에 활용할 수 있습니다.",
  },
];

export function LandingFeatureCards() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section className="bg-muted/20">
      <div className="text-center space-y-4 mb-10 md:mb-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          마케팅에 필요한 모든것, 여기에 있습니다
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          다채널 성과부터 리포트·알림·프로젝트 진척도까지, 마케팅에 필요한 기능을 한곳에서 이용할 수 있습니다.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, description }, i) => (
          <Card key={title} className="border-border bg-card flex flex-col">
            <CardHeader className="flex-1">
              <Icon className="h-6 w-6 text-primary mb-2" />
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-5 pt-0">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded py-2.5 min-h-[44px]"
              >
                자세히 보기
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 overflow-hidden rounded-xl">
          {openIndex !== null && (() => {
            const f = features[openIndex];
            const Icon = f.icon;
            return (
              <>
                <div className="bg-muted/30 px-6 pt-6 pb-4">
                  <DialogHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl text-left">{f.title}</DialogTitle>
                  </DialogHeader>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {f.detail}
                  </p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
