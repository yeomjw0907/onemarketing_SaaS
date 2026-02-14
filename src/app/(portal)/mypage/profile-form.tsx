"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatPhoneInput(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function phoneToDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface ProfileFormProps {
  displayName: string;
  email: string;
  contactPhone: string | null;
}

export function ProfileForm({
  displayName,
  email,
  contactPhone,
}: ProfileFormProps) {
  const [display_name, setDisplayName] = useState(displayName ?? "");
  const [contact_phone, setContactPhone] = useState(contactPhone ?? "");
  const [emailField, setEmailField] = useState(email ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!display_name.trim()) {
      setError("담당자명을 입력해 주세요.");
      return;
    }
    if (!emailField.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/mypage/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: display_name.trim(),
          email: emailField.trim(),
          contact_name: display_name.trim() || null,
          contact_phone: contact_phone ? phoneToDigits(contact_phone) || null : null,
          contact_email: emailField.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      toast.success("저장되었습니다.");
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">담당자 정보</CardTitle>
        <CardDescription>
          담당자명, 전화번호, 이메일을 확인하고 수정할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="display_name">담당자명</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="예: 홍길동"
              value={display_name}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">전화번호</Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="예: 010-1234-5678"
              value={formatPhoneInput(contact_phone)}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="예: name@company.com"
              value={emailField}
              onChange={(e) => setEmailField(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
