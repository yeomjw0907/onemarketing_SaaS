"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("로그인 정보가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      // signInWithPassword 응답의 user 사용 (getUser() 호출 제거로 왕복 1회 절약)
      const user = authData?.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* 로그인 중 전체 화면 로딩 오버레이 */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-200"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">O</span>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
              로그인 중...
            </p>
            <p className="text-xs text-muted-foreground">
              잠시만 기다려 주세요
            </p>
          </div>
        </div>
      )}

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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
