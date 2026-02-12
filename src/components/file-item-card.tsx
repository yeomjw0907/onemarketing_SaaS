"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Eye, Download, RefreshCw, FileText } from "lucide-react";

interface FileItemCardProps {
  title: string;
  subtitle?: string;
  date?: string;
  badge?: string;
  bucket: string;
  filePath: string;
}

export function FileItemCard({
  title,
  subtitle,
  date,
  badge,
  bucket,
  filePath,
}: FileItemCardProps) {
  const [loading, setLoading] = useState(false);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const getSignedUrl = async (action: "view" | "download") => {
    setLoading(true);
    try {
      const res = await fetch("/api/files/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, file_path: filePath, action }),
      });
      const data = await res.json();
      if (data.url) {
        if (action === "view") {
          setViewUrl(data.url);
          setExpiresAt(data.expiresAt);
          window.open(data.url, "_blank");
        } else {
          // Download
          const a = document.createElement("a");
          a.href = data.url;
          a.download = filePath.split("/").pop() || "download";
          a.click();
        }
      }
    } catch (err) {
      console.error("Failed to get signed URL:", err);
    } finally {
      setLoading(false);
    }
  };

  const extendUrl = () => getSignedUrl("view");

  return (
    <Card className="transition-subtle hover:shadow-md">
      <CardContent className="py-4 px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-medium truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                {date && (
                  <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => getSignedUrl("view")}
              disabled={loading}
              title="보기"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => getSignedUrl("download")}
              disabled={loading}
              title="다운로드"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={extendUrl}
              disabled={loading}
              title="URL 갱신"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {expiresAt && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            URL 만료: {new Date(expiresAt).toLocaleTimeString("ko-KR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
