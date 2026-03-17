"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  token: string;
  invitedEmail: string;
  invitedRole: string;
  agencyName: string;
  agencyId: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "오너",
  manager: "매니저",
  viewer: "뷰어",
};

export default function AgencyInviteAccept({ token, invitedEmail, invitedRole, agencyName, agencyId }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agency/invite-agency/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          displayName: displayName.trim(),
          password,
          invitedEmail,
          agencyId,
          invitedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 생성된 계정으로 자동 로그인
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitedEmail,
        password,
      });

      if (signInError) {
        setError("계정이 생성되었습니다. 로그인 페이지에서 로그인해 주세요.");
        router.push("/login");
        return;
      }

      router.push("/admin");
    } catch {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            O
          </div>
          <CardTitle>팀 초대를 수락했습니다</CardTitle>
          <CardDescription>
            <strong>{agencyName}</strong> 팀에 합류하려면 계정을 설정해 주세요.
          </CardDescription>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {ROLE_LABELS[invitedRole] ?? invitedRole}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={invitedEmail} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">이름 <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                placeholder="담당자 이름"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 설정 <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</>
              ) : (
                "팀 합류하기"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
