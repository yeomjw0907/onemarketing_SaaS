"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Report } from "@/lib/types/database";
import { formatDate, clientReportTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { useState } from "react";

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
    </div>
  );
}
