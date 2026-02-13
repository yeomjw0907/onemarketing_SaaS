"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError("Supabase 설정이 없거나 placeholder입니다. .env.local 확인 후, 프로젝트 폴더에서 .next 삭제하고 개발 서버를 다시 실행하세요.");
      setLoading(false);
      return;
    }

    try {
      const trimmed = idOrEmail.trim().toLowerCase();
      // @ 포함이면 이메일로, 아니면 클라이언트 코드 → code@onecation.co.kr
      const email = trimmed.includes("@") ? trimmed : `${trimmed}@onecation.co.kr`;

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("로그인 정보가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      // Check role + must_change_password
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("user_id", user.id)
          .single();

        // 초기 비밀번호 변경 필요 시
        if (profile?.must_change_password) {
          router.push("/change-password");
          router.refresh();
          return;
        }

        if (profile?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/overview");
        }
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof TypeError && (err as Error).message?.includes("fetch")
          ? "서버에 연결할 수 없습니다. 네트워크를 확인하고, .env.local 설정 후 개발 서버를 재시작해 주세요."
          : "로그인 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            O
          </div>
          <CardTitle className="text-xl">Onecation Portal</CardTitle>
          <CardDescription>클라이언트 포털에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idOrEmail">이메일</Label>
              <Input
                id="idOrEmail"
                type="text"
                placeholder="예: user@company.com"
                value={idOrEmail}
                onChange={(e) => setIdOrEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
