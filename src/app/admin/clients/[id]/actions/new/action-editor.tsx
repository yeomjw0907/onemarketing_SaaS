"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Action, ActionStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { findServiceItem } from "@/lib/service-catalog";
import { ServiceIcon } from "@/components/service-icon";
import { ArrowLeft, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const TiptapEditor = dynamic(
  () => import("@/components/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="border rounded-lg p-6 text-center text-muted-foreground">에디터 로딩 중...</div> }
);

interface Props {
  clientId: string;
  clientName: string;
  enabledServiceKeys: string[];
  action: Action | null;
}

export function ActionEditor({ clientId, clientName, enabledServiceKeys, action }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!action;

  const [title, setTitle] = useState(action?.title ?? "");
  const [content, setContent] = useState(action?.description ?? "");
  const [status, setStatus] = useState<ActionStatus>(action?.status ?? "planned");
  const [startDate, setStartDate] = useState(action?.action_date?.slice(0, 10) ?? new Date().toISOString().split("T")[0]);
  const [useEndDate, setUseEndDate] = useState(!!action?.end_date);
  const [endDate, setEndDate] = useState(action?.end_date?.slice(0, 10) ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    action?.category ? action.category.split(",").map((c) => c.trim()).filter(Boolean) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("제목을 입력하세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const categoryValue = selectedCategories.length > 0 ? selectedCategories.join(",") : "general";
      const payload = {
        title: title.trim(),
        description: content.trim() || null,
        status,
        action_date: startDate,
        end_date: useEndDate && endDate ? endDate : null,
        category: categoryValue,
      };
      if (isEdit && action) {
        await supabase.from("actions").update(payload).eq("id", action.id);
      } else {
        await supabase.from("actions").insert({
          ...payload,
          client_id: clientId,
          visibility: "visible",
          created_by: user.id,
        });
      }
      router.push(`/admin/clients/${clientId}`);
      router.refresh();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = enabledServiceKeys.length > 0 ? enabledServiceKeys : ["general"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/clients/${clientId}`}>
            <Button variant="ghost" size="icon" aria-label="클라이언트 상세로"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? "실행 항목 수정" : "실행 항목 작성"}</h1>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "저장 중..." : "저장"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>제목 *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="실행 항목 제목" className="text-lg" />
          </div>

          <div className="space-y-2">
            <Label>연결 서비스 (해당하는 서비스를 클릭해 선택, 중복 가능)</Label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((key) => {
                const item = key === "general" ? null : findServiceItem(key);
                const label = key === "general" ? "일반" : item?.label ?? key;
                const isSelected = selectedCategories.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      isSelected ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    {item && <ServiceIcon iconKey={item.iconKey} color={item.color} size="sm" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작일 *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={useEndDate} onChange={(e) => setUseEndDate(e.target.checked)} className="rounded" />
                  종료일 사용
                </label>
              </div>
              {useEndDate && (
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">계획됨</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="done">완료</SelectItem>
                <SelectItem value="hold">보류</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">상세 설명</Label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="실행 항목 상세 내용을 작성하세요..."
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
