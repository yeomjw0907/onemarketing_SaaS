import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { Notification, Report } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CheckCircle2, FileText } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

// ── 한국어 라벨 / 단위 매핑 ──
const LABEL: Record<string, string> = {
  spend:           "광고비",
  clicks:          "클릭",
  impressions:     "노출",
  conversions:     "전환",
  cpc:             "CPC",
  ctr:             "CTR",
  spendThisMonth:  "이번달 광고비",
  daysRemaining:   "남은 일수",
  daysInMonth:     "이번달 총 일수",
  lastWeekSpend:   "지난주 집행",
  lastWeekConversions: "전환",
  period:          "기간",
};

const UNIT: Record<string, string> = {
  spend:          "원",
  clicks:         "회",
  impressions:    "회",
  conversions:    "건",
  cpc:            "원",
  ctr:            "%",
  spendThisMonth: "원",
  daysRemaining:  "일",
  daysInMonth:    "일",
  lastWeekSpend:  "원",
  lastWeekConversions: "건",
};

function formatValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    if (key === "ctr") return `${value}`;
    return value.toLocaleString("ko-KR");
  }
  return String(value ?? "-");
}

function MetricRow({ k, value }: { k: string; value: unknown }) {
  if (k === "period") return null;
  const label = LABEL[k] ?? k;
  const unit = UNIT[k] ?? "";
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {formatValue(k, value)}{unit}
      </span>
    </div>
  );
}

function ExpiredView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30">
      <div className="max-w-sm w-full bg-card rounded-2xl border shadow-sm p-8 text-center space-y-4">
        <p className="text-2xl">⏰</p>
        <h2 className="text-lg font-semibold">링크가 만료됐어요</h2>
        <p className="text-sm text-muted-foreground">로그인하면 전체 대시보드에서 확인하실 수 있어요.</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">로그인하여 대시보드 보기</Link>
        </Button>
      </div>
    </div>
  );
}

async function renderNotificationView(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  row: Notification
) {
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", row.client_id)
    .single();

  const snapshot = (row.metrics_snapshot as Record<string, unknown>) ?? {};
  const period = typeof snapshot.period === "string" ? snapshot.period : null;
  const clientName = client?.name ?? "";

  const TYPE_CONFIG = {
    MON_REVIEW:   { emoji: "📊", title: "지난주 성과 리뷰",  color: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800" },
    WED_BUDGET:   { emoji: "💰", title: "예산 페이싱 현황",  color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
    THU_PROPOSAL: { emoji: "🎯", title: "다음 주 운영 제안", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
  } as const;

  const cfg = TYPE_CONFIG[row.report_type as keyof typeof TYPE_CONFIG] ?? { emoji: "📋", title: row.report_type, color: "bg-muted border-border" };

  // THU_PROPOSAL: approval token 유효성 확인
  let canApprove = false;
  if (row.report_type === "THU_PROPOSAL" && row.approval_token && row.approval_token_expires_at) {
    canApprove = new Date(row.approval_token_expires_at) > new Date() && row.approval_status === "PENDING";
  }
  const approveUrl = canApprove
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/report/approve/${row.approval_token}`
    : null;

  // 표시할 지표 (period 제외, undefined/null 제외)
  const metricEntries = Object.entries(snapshot).filter(
    ([k, v]) => k !== "period" && v !== null && v !== undefined
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background py-8 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* 헤더 */}
        <div className={`rounded-2xl border p-5 ${cfg.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{cfg.emoji}</span>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{clientName}</p>
              <h1 className="text-base font-bold leading-tight">{cfg.title}</h1>
            </div>
          </div>
          {period && (
            <p className="text-xs text-muted-foreground">{period}</p>
          )}
        </div>

        {/* AI 요약 */}
        {row.ai_message && (
          <div className="bg-card rounded-2xl border shadow-sm p-5">
            <p className="text-sm leading-relaxed text-foreground">{row.ai_message}</p>
          </div>
        )}

        {/* 지표 카드 */}
        {metricEntries.length > 0 && (
          <div className="bg-card rounded-2xl border shadow-sm p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">주요 지표</p>
            <div className="space-y-0">
              {metricEntries.map(([k, v]) => (
                <MetricRow key={k} k={k} value={v} />
              ))}
            </div>
          </div>
        )}

        {/* CTA 버튼 */}
        <div className="space-y-2 pt-1">
          {approveUrl && (
            <Button asChild className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Link href={approveUrl}>
                <CheckCircle2 className="h-4 w-4" />
                제안 승인하기
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/login">
              <LayoutDashboard className="h-4 w-4" />
              전체 대시보드 보기
            </Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-4">원마케팅 포털</p>
      </div>
    </div>
  );
}

async function renderReportView(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  report: Report
) {
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", report.client_id)
    .single();

  const clientName = client?.name ?? "";
  const publishedAt = new Date(report.published_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background py-8 px-4">
      <div className="max-w-sm mx-auto space-y-4">

        {/* 헤더 */}
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">{clientName}</p>
              <p className="text-xs text-muted-foreground">{publishedAt}</p>
            </div>
          </div>
          <h1 className="text-base font-bold leading-tight">{report.title}</h1>
        </div>

        {/* 리포트 본문 */}
        {report.summary && (
          <div className="bg-card rounded-2xl border shadow-sm p-5">
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: report.summary }}
            />
          </div>
        )}

        {/* CTA */}
        <Button asChild variant="outline" className="w-full gap-2">
          <Link href="/login">
            <LayoutDashboard className="h-4 w-4" />
            로그인하여 대시보드 보기
          </Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-4">원마케팅 포털</p>
      </div>
    </div>
  );
}

export default async function ReportViewByTokenPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createServiceClient();

  // 1) notifications 테이블에서 토큰 조회
  const { data: notification } = await supabase
    .from("notifications")
    .select("*")
    .eq("view_token", token)
    .single();

  if (notification) {
    const row = notification as Notification;
    const expiresAt = new Date(row.view_token_expires_at);
    if (expiresAt < new Date()) return <ExpiredView />;
    return renderNotificationView(supabase, row);
  }

  // 2) reports 테이블에서 토큰 조회
  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("view_token", token)
    .single();

  if (report) {
    const row = report as Report;
    if (row.view_token_expires_at) {
      const expiresAt = new Date(row.view_token_expires_at);
      if (expiresAt < new Date()) return <ExpiredView />;
    }
    return renderReportView(supabase, row);
  }

  notFound();
}
