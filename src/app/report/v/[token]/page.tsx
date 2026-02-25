import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { Notification, Report } from "@/lib/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, BarChart3, Wallet, Target, FileText } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

const REPORT_TYPE_LABEL: Record<string, { label: string; icon: typeof BarChart3 }> = {
  MON_REVIEW: { label: "지난주 성과 리뷰", icon: BarChart3 },
  WED_BUDGET: { label: "예산 페이싱", icon: Wallet },
  THU_PROPOSAL: { label: "다음 주 제안", icon: Target },
};

function ExpiredView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h2 className="text-lg font-semibold text-center">링크 만료</h2>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            이 링크는 만료되었습니다. 로그인하여 확인해 주세요.
          </p>
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">로그인하여 대시보드 보기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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

  const meta = REPORT_TYPE_LABEL[row.report_type] ?? { label: row.report_type, icon: BarChart3 };
  const Icon = meta.icon;
  const snapshot = (row.metrics_snapshot as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {client?.name ?? ""} · {new Date(row.sent_at).toLocaleDateString("ko-KR")}
          </span>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">{meta.label}</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            {row.ai_message && (
              <p className="text-base leading-relaxed">{row.ai_message}</p>
            )}
            {Object.keys(snapshot).length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">주요 지표</p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(snapshot).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">
                        {typeof value === "number"
                          ? value.toLocaleString()
                          : String(value ?? "-")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link href="/login" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              전체 대시보드 보기
            </Link>
          </Button>
        </div>
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

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3.5 w-3.5" />
            마케팅 보고서
          </Badge>
          <span className="text-sm text-muted-foreground">
            {client?.name ?? ""} · {new Date(report.published_at).toLocaleDateString("ko-KR")}
          </span>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">{report.title}</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.summary && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: report.summary }}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link href="/login" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              로그인하여 대시보드 보기
            </Link>
          </Button>
        </div>
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
