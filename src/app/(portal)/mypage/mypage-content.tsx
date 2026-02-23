"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** 숫자만 추출 후 010-XXXX-XXXX 형식으로 하이픈 포맷 */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits.length) return "";
  // 02 (서울): 02-XXX-XXXX
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 10)}`;
  }
  // 010, 011, 016, 017, 018, 019: 010-XXXX-XXXX
  if (digits.match(/^01[0-9]/)) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  // 그 외 지역번호 (031 등): 0XX-XXX-XXXX 또는 0XX-XXXX-XXXX
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

interface MypageContentProps {
  email: string;
  client: Client | null;
}

export function MypageContent({ email, client }: MypageContentProps) {
  const router = useRouter();
  const [contactName, setContactName] = useState(client?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(() =>
    formatPhoneNumber(client?.contact_phone ?? "")
  );
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/mypage/client", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "저장에 실패했습니다.");
        return;
      }
      toast.success("저장되었습니다.");
      router.refresh();
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (password.length < 6) {
      setPasswordError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("user_id", user.id);
      }
      toast.success("비밀번호가 변경되었습니다.");
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      setPasswordError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 계정 정보 (조회) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">클라이언트:</span> {client?.name ?? "-"}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">이메일:</span> {email || "-"}
          </p>
        </CardContent>
      </Card>

      {/* 담당자 정보 (조회 및 수정) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">담당자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_name">담당자명</Label>
              <Input
                id="contact_name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="담당자명"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_phone">담당자 연락처</Label>
              <Input
                id="contact_phone"
                type="tel"
                inputMode="numeric"
                value={contactPhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setContactPhone(formatPhoneNumber(digits));
                }}
                placeholder="010-1234-5678"
                maxLength={13}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "담당자 정보 저장"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">비밀번호 변경</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            새 비밀번호를 입력하여 변경합니다. 변경 후에도 로그인 상태가 유지됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">비밀번호 확인</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="다시 입력"
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button type="submit" variant="secondary" disabled={passwordLoading}>
              {passwordLoading ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
