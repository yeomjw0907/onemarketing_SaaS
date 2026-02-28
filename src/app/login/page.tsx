"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredMessage, setRegisteredMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("registered") === "1") setRegisteredMessage(true);
  }, [searchParams]);

  const rejected = searchParams.get("rejected") === "1";

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
        } else if (profile?.role === "pending") {
          router.push("/pending");
        } else         if (profile?.role === "rejected") {
          router.push("/login?rejected=1");
          setLoading(false);
          return;
        } else {
          router.push("/overview");
        }
        router.refresh();
        // 성공 시 setLoading(false) 하지 않음 — 오버레이가 페이지 전환 완료까지 유지되어
        // 목적지 로드 중 1~2초 경직 구간을 로딩 화면으로 덮음
        return;
      }
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof TypeError && (err as Error).message?.includes("fetch")
          ? "서버에 연결할 수 없습니다. 네트워크를 확인하고, .env.local 설정 후 개발 서버를 재시작해 주세요."
          : "로그인 중 오류가 발생했습니다.";
      setError(message);
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
                <img src="/logo-light.png" alt="" className="h-6 w-auto object-contain opacity-90" aria-hidden />
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

      <div className="relative z-10 w-full max-w-sm">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src="/logo-light.png" alt="ONEmarketing" className="h-10 w-auto object-contain" />
          </div>
          <CardTitle className="text-xl">ONEmarketing Portal</CardTitle>
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
            {registeredMessage && (
              <p className="text-sm text-green-600 text-center bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg py-2 px-3">
                가입이 완료되었습니다. 관리자 승인 후 로그인하여 이용할 수 있습니다.
              </p>
            )}
            {rejected && (
              <p className="text-sm text-destructive text-center bg-destructive/10 border border-destructive/20 rounded-lg py-2 px-3">
                가입이 거절되었습니다. 문의가 필요하시면 관리자에게 연락해 주세요.
              </p>
            )}
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
          <p className="text-center text-sm text-muted-foreground mt-4">
            계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="inline-block py-1.5 px-1 -my-1 -mx-1 rounded text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
            >
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
      {/* 홈페이지에 개인정보처리방침 링크 노출 (Google OAuth 검증 요건) */}
      <footer className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="hover:text-foreground underline underline-offset-2"
          >
            개인정보 처리방침
          </Link>
          {" · "}
          <Link
            href="/terms"
            className="hover:text-foreground underline underline-offset-2"
          >
            이용약관
          </Link>
        </p>
      </footer>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <img src="/logo-light.png" alt="ONEmarketing" className="h-10 w-auto object-contain" />
          </div>
          <CardTitle className="text-xl">ONEmarketing Portal</CardTitle>
          <CardDescription>클라이언트 포털에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
