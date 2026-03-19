import {
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  FileText,
  ListTodo,
  Bell,
  FolderKanban,
} from "lucide-react";
import { Section } from "./Section";

const features = [
  {
    icon: LayoutDashboard,
    title: "다채널 광고 성과",
    description: "Google Ads, GA4, Meta 데이터를 한 대시보드에서. 채널마다 로그인할 필요 없이 성과를 한눈에 비교합니다.",
  },
  {
    icon: MessageSquare,
    title: "카카오톡 매주 3회 정기 보고",
    description: "월요일 지난주 리뷰, 수요일 예산 페이싱, 목요일 다음 주 제안. 설정만 해두면 자동 발송됩니다.",
  },
  {
    icon: FileText,
    title: "주간·월간 성과 리포트",
    description: "리포트 작성·발행 즉시 고객에게 카카오톡으로 안내. 수동 공유 없이 이력까지 자동 관리됩니다.",
  },
  {
    icon: ListTodo,
    title: "실행 현황·일정 관리",
    description: "마케팅 태스크와 캘린더를 한곳에서. 상태 변경·일정 리마인더 시 알림톡이 자동 발송됩니다.",
  },
  {
    icon: BarChart3,
    title: "KPI·성과 대시보드",
    description: "방문자, 리드, 전환율, 광고비를 카드와 차트로 집계. 목표 대비 달성률을 실시간으로 확인합니다.",
  },
  {
    icon: Bell,
    title: "리포트·상태 변경 알림",
    description: "리포트 발행과 실행 항목 상태 변경 시 카카오톡으로 즉시 알림. 중요한 이벤트를 놓치지 않습니다.",
  },
  {
    icon: FolderKanban,
    title: "마케팅 프로젝트 진척도",
    description: "프로젝트별 단계(stage)와 진척률(%)로 여러 프로젝트를 동시에 관리. 보고와 내부 점검에 바로 활용됩니다.",
  },
];

export function LandingFeatureCards() {
  return (
    <Section className="py-16 md:py-24">
      <div className="border-t border-neutral-950 pt-12 md:pt-16 mb-12 md:mb-16">
        <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
          전체 기능
        </p>
        <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tighter text-neutral-950">
          마케팅에 필요한 모든 것
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {features.map(({ icon: Icon, title, description }, i) => (
          <div
            key={title}
            className={`flex gap-5 py-8 ${
              i % 2 === 0 ? "md:pr-12" : "md:pl-12 md:border-l border-neutral-100"
            } border-b border-neutral-100`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-950">{title}</p>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
