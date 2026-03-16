import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { formatDate, clientReportTitle } from "@/lib/utils";
import { ShareButton } from "./share-button";

const TiptapViewer = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapViewer),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">로딩 중...</div> }
);

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminReportDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*, clients(name)")
    .eq("id", id)
    .single();

  if (!report) notFound();

  const { data: comments } = await supabase
    .from("report_comments")
    .select("id, author_name, body, reaction, created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  const hasContent = report.summary && report.summary.startsWith("<");
  const clientName = (report.clients as { name?: string } | null)?.name ?? "-";

  const approvedCount = comments?.filter((c) => c.reaction === "approved").length ?? 0;
  const rejectedCount = comments?.filter((c) => c.reaction === "rejected").length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-start gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon" className="mt-1" aria-label="리포트 목록으로">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{clientName}</Badge>
            <Badge variant="secondary">{report.report_type === "weekly" ? "주간" : "월간"}</Badge>
            <span className="text-sm text-muted-foreground">{formatDate(report.published_at)}</span>
          </div>
          <h1 className="text-xl font-bold">{clientReportTitle(report.title)}</h1>
        </div>
        <ShareButton
          reportId={report.id}
          existingShareUrl={
            report.view_token && report.view_token_expires_at && new Date(report.view_token_expires_at) > new Date()
              ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/report/v/${report.view_token}`
              : undefined
          }
        />
      </div>

      {/* 리포트 본문 */}
      {hasContent && (
        <Card>
          <CardContent className="py-6 px-8">
            <TiptapViewer content={report.summary!} />
          </CardContent>
        </Card>
      )}
      {report.summary && !hasContent && (
        <Card>
          <CardContent className="py-6 px-8">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{report.summary}</div>
          </CardContent>
        </Card>
      )}

      {/* 피드백 요약 + 댓글 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            클라이언트 피드백
            <span className="ml-auto flex items-center gap-3 text-sm font-normal">
              {approvedCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <ThumbsUp className="h-3.5 w-3.5" />{approvedCount}건 승인
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <ThumbsDown className="h-3.5 w-3.5" />{rejectedCount}건 반려
                </span>
              )}
              {!approvedCount && !rejectedCount && (
                <span className="text-muted-foreground text-xs">피드백 없음</span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!comments || comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">아직 클라이언트 피드백이 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {c.author_name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium">{c.author_name}</span>
                      {c.reaction === "approved" && (
                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                          <ThumbsUp className="h-3 w-3 mr-1" />승인
                        </Badge>
                      )}
                      {c.reaction === "rejected" && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30">
                          <ThumbsDown className="h-3 w-3 mr-1" />반려
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
