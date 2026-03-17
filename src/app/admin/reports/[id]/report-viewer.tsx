"use client";

import dynamic from "next/dynamic";

const TiptapViewer = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapViewer),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">로딩 중...</div> }
);

export function ReportViewer({ content }: { content: string }) {
  return <TiptapViewer content={content} />;
}
