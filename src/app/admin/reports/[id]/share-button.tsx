"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, Loader2 } from "lucide-react";

interface Props {
  reportId: string;
  existingShareUrl?: string;
}

export function ShareButton({ reportId, existingShareUrl }: Props) {
  const [shareUrl, setShareUrl] = useState(existingShareUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/share-token`, { method: "POST" });
      const data = await res.json();
      if (data.shareUrl) setShareUrl(data.shareUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Link2 className="h-4 w-4 mr-1.5" />
        공유 링크
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-md border bg-popover p-4 shadow-md">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">리포트 공유 링크</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  로그인 없이 리포트를 열람할 수 있는 링크입니다. (유효기간 30일)
                </p>
              </div>
              {shareUrl && (
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="text-xs h-8" />
                  <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
              <Button size="sm" className="w-full" onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Link2 className="h-4 w-4 mr-1.5" />}
                {shareUrl ? "링크 재생성" : "공유 링크 생성"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
