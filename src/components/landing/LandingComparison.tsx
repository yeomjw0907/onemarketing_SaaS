import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROWS = [
  {
    category: "커뮤니케이션",
    label: "성과 공유 방식",
    before: "카카오톡 채팅, 이메일",
    after: "전용 포털 — 언제든 실시간 확인",
  },
  {
    category: "리포트",
    label: "월간 리포트",
    before: "엑셀/PPT 수작업 제작 (3~5시간)",
    after: "AI 자동 생성 + 클릭 한 번으로 발행",
  },
  {
    category: "데이터",
    label: "광고 성과 데이터",
    before: "각 플랫폼에 직접 들어가서 확인",
    after: "GA4·Meta·Naver 한 화면에 통합",
  },
  {
    category: "신뢰",
    label: "실행 내역 투명성",
    before: "구두 보고, 기억에 의존",
    after: "모든 액션이 타임라인으로 기록됨",
  },
  {
    category: "알림",
    label: "정기 성과 알림",
    before: "담당자가 직접 연락",
    after: "카카오 알림톡 자동 발송 (월/수/목)",
  },
  {
    category: "자료",
    label: "브랜드 에셋 관리",
    before: "구글 드라이브 폴더 공유",
    after: "클라이언트 전용 자료실",
  },
  {
    category: "온보딩",
    label: "신규 클라이언트 셋업",
    before: "수작업 안내, 자료 정리",
    after: "이메일 초대 → 즉시 포털 접속",
  },
];

export function LandingComparison() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12 space-y-3">
          <Badge variant="outline" className="text-xs">비교</Badge>
          <h2 className="text-3xl font-bold tracking-tight">
            기존 방식 vs. ONEmarketing 포털
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            에이전시가 매달 낭비하는 시간을 되찾아드립니다.
          </p>
        </div>

        <div className="rounded-2xl border bg-background overflow-hidden shadow-sm">
          {/* 헤더 */}
          <div className="grid grid-cols-[1fr_1.2fr_1.2fr] gap-0">
            <div className="p-4 bg-muted/50 border-b border-r text-sm font-medium text-muted-foreground" />
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-r text-center">
              <span className="text-sm font-semibold text-red-700 dark:text-red-400">기존 방식</span>
              <p className="text-xs text-muted-foreground mt-0.5">카카오톡 · 엑셀 · 이메일</p>
            </div>
            <div className="p-4 bg-primary/5 border-b text-center">
              <span className="text-sm font-semibold text-primary">ONEmarketing 포털</span>
              <p className="text-xs text-muted-foreground mt-0.5">클라이언트 전용 대시보드</p>
            </div>
          </div>

          {/* 비교 행 */}
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_1.2fr_1.2fr] gap-0 ${i < ROWS.length - 1 ? "border-b" : ""}`}
            >
              <div className="p-4 border-r bg-muted/20">
                <p className="text-xs text-muted-foreground">{row.category}</p>
                <p className="text-sm font-medium mt-0.5">{row.label}</p>
              </div>
              <div className="p-4 border-r flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{row.before}</p>
              </div>
              <div className="p-4 flex items-start gap-2 bg-primary/[0.02]">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{row.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
