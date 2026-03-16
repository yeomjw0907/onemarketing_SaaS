"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Report, ReportComment } from "@/lib/types/database";
import { formatDate, clientReportTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileText, Download, MessageSquare, ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const TiptapViewer = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapViewer),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">로딩 중...</div> }
);

interface Props {
  report: Report;
}

export function ReportDetailView({ report }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const hasContent = report.summary && report.summary.startsWith("<");
  const hasFile = report.file_path && report.file_path !== "inline";

  // 댓글/피드백 상태
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [text, setText] = useState("");
  const [reaction, setReaction] = useState<"approved" | "rejected" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/comments`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } finally {
      setCommentsLoading(false);
    }
  }, [report.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/reports/${report.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, reaction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "전송 실패");
      } else {
        setComments((prev) => [...prev, data.comment]);
        setText("");
        setReaction(null);
      }
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!hasFile) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "reports", file_path: report.file_path, action: "download" }),
      });
      const data = await res.json();
      if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = report.file_path.split("/").pop() || "download";
        a.click();
      } else {
        setDownloadError("다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadError("다운로드에 실패했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start gap-4">
        <Link href="/reports" aria-label="리포트 목록으로">
          <Button variant="ghost" size="icon" className="mt-1" aria-label="리포트 목록으로"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">{report.report_type === "weekly" ? "주간" : "월간"}</Badge>
            <span className="text-sm text-muted-foreground">{formatDate(report.published_at)}</span>
          </div>
          <h1 className="text-2xl font-bold">{clientReportTitle(report.title)}</h1>
        </div>
      </div>

      {/* 리포트 본문 (HTML content) */}
      {hasContent && (
        <Card>
          <CardContent className="py-6 px-8">
            <TiptapViewer content={report.summary!} />
          </CardContent>
        </Card>
      )}

      {/* 텍스트 요약 (HTML이 아닌 경우) */}
      {report.summary && !hasContent && (
        <Card>
          <CardContent className="py-6 px-8">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {report.summary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 첨부 파일 */}
      {hasFile && (
        <Card>
          <CardContent className="py-4 px-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">첨부 파일</p>
                  <p className="text-xs text-muted-foreground">{report.file_path.split("/").pop()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} aria-label={downloading ? "다운로드 중" : "첨부 파일 다운로드"}>
                <Download className="h-4 w-4 mr-1" />
                {downloading ? "다운로드 중..." : "다운로드"}
              </Button>
                {downloadError && (
                  <p className="text-xs text-destructive" role="alert">{downloadError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 피드백 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            피드백 &amp; 댓글
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 기존 댓글 목록 */}
          {commentsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">아직 피드백이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
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

          {/* 댓글 작성 폼 */}
          <div className="pt-2 border-t space-y-3">
            {/* 승인/반려 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReaction(reaction === "approved" ? null : "approved")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  reaction === "approved"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                승인
              </button>
              <button
                type="button"
                onClick={() => setReaction(reaction === "rejected" ? null : "rejected")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                  reaction === "rejected"
                    ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                반려
              </button>
              {reaction && (
                <span className="text-xs text-muted-foreground self-center ml-1">
                  선택됨 — 댓글과 함께 전송됩니다.
                </span>
              )}
            </div>

            <Textarea
              placeholder="리포트에 대한 의견을 남겨주세요..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={2000}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{text.length}/2000</span>
              {submitError && <p className="text-xs text-destructive flex-1 text-right">{submitError}</p>}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                전송
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
