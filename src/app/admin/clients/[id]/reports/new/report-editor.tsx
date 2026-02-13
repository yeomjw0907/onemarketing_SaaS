"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { ReportType } from "@/lib/types/database";
import { safeFilePath } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Upload } from "lucide-react";

// SSR 비활성화 — Tiptap은 브라우저에서만 동작
const TiptapEditor = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="border rounded-lg p-8 text-center text-muted-foreground">에디터 로딩 중...</div> }
);

interface Props {
  clientId: string;
  clientName: string;
}

export function ReportEditor({ clientId, clientName }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title) { setError("제목은 필수입니다."); return; }
    if (!content && !file) { setError("내용을 작성하거나 파일을 첨부해주세요."); return; }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let filePath = "";

      if (file) {
        filePath = safeFilePath(clientId, file.name);
        const { error: upErr } = await supabase.storage
          .from("reports")
          .upload(filePath, file);
        if (upErr) {
          setError("파일 업로드 실패: " + upErr.message);
          setLoading(false);
          return;
        }
      }

      const { error: insertErr } = await supabase.from("reports").insert({
        client_id: clientId,
        report_type: reportType,
        title,
        summary: content || null,
        file_path: filePath || "inline",
        published_at: publishedAt,
        visibility: "visible",
        created_by: user.id,
      });

      if (insertErr) {
        setError("저장 실패: " + insertErr.message);
        setLoading(false);
        return;
      }

      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch {
      setError("오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/clients/${clientId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">리포트 작성</h1>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "저장 중..." : "발행"}
        </Button>
      </div>

      {/* 메타 정보 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>제목 *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="2026년 2월 2주차 마케팅 리포트"
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>유형</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">주간</SelectItem>
                  <SelectItem value="monthly">월간</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>발행일 *</Label>
              <Input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tiptap 에디터 */}
      <div>
        <Label className="mb-2 block">리포트 내용</Label>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="리포트 내용을 작성하세요... 서식을 활용하여 노션처럼 작성할 수 있습니다."
        />
      </div>

      {/* 파일 첨부 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">파일 첨부 (선택)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="max-w-md"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                <Upload className="h-3 w-3 inline mr-1" />
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
      )}
    </div>
  );
}
