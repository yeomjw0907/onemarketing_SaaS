import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_DOCS } from "@/content/legal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "이용약관 | Onecation",
  description: "원마케팅·원케이션 서비스 이용약관(서비스 약관)",
};

export default function TermsPage() {
  const doc = LEGAL_DOCS.terms;
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← 홈
            </Button>
          </Link>
        </div>
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">{doc.title}</h1>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {doc.content}
          </div>
        </article>
      </div>
    </div>
  );
}
