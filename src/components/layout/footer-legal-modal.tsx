"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LEGAL_DOCS, type LegalDocKey } from "@/content/legal";

const LEGAL_ITEMS: { key: LegalDocKey; label: string }[] = [
  { key: "privacy", label: "개인정보 처리방침" },
  { key: "terms", label: "이용약관" },
  { key: "service", label: "서비스 이용약관" },
  { key: "marketing", label: "마케팅 정보 수신 동의" },
];

export function FooterLegalLinks() {
  const [openKey, setOpenKey] = useState<LegalDocKey | null>(null);
  const doc = openKey ? LEGAL_DOCS[openKey] : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {LEGAL_ITEMS.map(({ key, label }) => (
          <button
            type="button"
            key={key}
            onClick={() => setOpenKey(key)}
            className="hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <Dialog open={!!openKey} onOpenChange={(open) => !open && setOpenKey(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col gap-0 p-0 sm:max-w-lg">
          {doc && (
            <>
              <DialogHeader className="shrink-0 border-b px-6 py-4">
                <DialogTitle className="text-base">{doc.title}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                  {doc.content}
                </pre>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
