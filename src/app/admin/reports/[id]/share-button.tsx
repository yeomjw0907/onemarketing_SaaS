"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, Loader2, X } from "lucide-react";

interface Props {
  reportId: string;
  existingShareUrl?: string;
}

export function ShareButton({ reportId, existingShareUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState(existingShareUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/share-token`, {
        method: "POST",
      });
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
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
        <Link2 className="h-4 w-4 mr-1.5" />
        공유 링크
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-popover shadow-md p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">리포트 공유 링크</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                로그인 없이 리포트를 열람할 수 있는 링크입니다. (유효기간 30일)
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground mt-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {shareUrl ? (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs h-8" />
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ) : null}

          <Button size="sm" className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Link2 className="h-4 w-4 mr-1.5" />}
            {shareUrl ? "링크 재생성" : "공유 링크 생성"}
          </Button>
        </div>
      )}
    </div>
  );
}
