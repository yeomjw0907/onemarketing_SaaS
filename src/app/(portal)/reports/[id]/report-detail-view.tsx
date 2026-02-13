"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Report } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
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
  const hasContent = report.summary && report.summary.startsWith("<");
  const hasFile = report.file_path && report.file_path !== "inline";

  const handleDownload = async () => {
    if (!hasFile) return;
    setDownloading(true);
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
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon" className="mt-1"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">{report.report_type === "weekly" ? "주간" : "월간"}</Badge>
            <span className="text-sm text-muted-foreground">{formatDate(report.published_at)}</span>
          </div>
          <h1 className="text-2xl font-bold">{report.title}</h1>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">첨부 파일</p>
                  <p className="text-xs text-muted-foreground">{report.file_path.split("/").pop()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                <Download className="h-4 w-4 mr-1" />
                {downloading ? "다운로드 중..." : "다운로드"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
