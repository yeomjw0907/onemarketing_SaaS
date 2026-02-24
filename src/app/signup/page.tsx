"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Footer } from "@/components/layout/footer";
import { LEGAL_DOCS, type LegalDocKey } from "@/content/legal";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 6;
function passwordRules(pw: string) {
  const hasMinLength = pw.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw);
  return { hasMinLength, hasLetter, hasNumber, hasSpecial };
}
function passwordValid(pw: string) {
  const r = passwordRules(pw);
  return r.hasMinLength && r.hasLetter && r.hasNumber && r.hasSpecial;
}

/** 숫자만 추출 후 010-XXXX-XXXX 형식으로 하이픈 삽입 */
function formatPhoneWithHyphen(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [legalModalKey, setLegalModalKey] = useState<LegalDocKey | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const agreeAll = agreeTerms && agreePrivacy && agreeMarketing;
  const setAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneWithHyphen(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const company = companyName.trim();
    if (!company) {
      setError("회사/단체명을 입력해 주세요.");
      return;
    }
    const name = displayName.trim();
    if (!name) {
      setError("이름을 입력해 주세요.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("전화번호를 입력해 주세요. (예: 010-1234-5678)");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    const rules = passwordRules(password);
    if (!rules.hasMinLength) {
      setError("비밀번호는 6자 이상 입력해 주세요.");
      return;
    }
    if (!rules.hasLetter) {
      setError("비밀번호에 영문을 포함해 주세요.");
      return;
    }
    if (!rules.hasNumber) {
      setError("비밀번호에 숫자를 포함해 주세요.");
      return;
    }
    if (!rules.hasSpecial) {
      setError("비밀번호에 특수문자를 포함해 주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreeTerms) {
      setError("이용약관에 동의해 주세요.");
      return;
    }
    if (!agreePrivacy) {
      setError("개인정보 수집 및 이용에 동의해 주세요.");
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError("Supabase 설정이 없습니다. .env.local을 확인해 주세요.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.code === "user_already_exists") {
          setError("이미 가입된 이메일입니다.");
        } else if (authError.message.includes("weak") || authError.message.includes("easy to guess")) {
          setError("이 비밀번호는 유출·흔한 비밀번호 목록에 포함되어 사용할 수 없습니다. 회사명·숫자·특수문자 등 조합으로 더 독특한 비밀번호를 사용해 주세요.");
        } else {
          setError(authError.message || "가입에 실패했습니다.");
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("가입 처리 중 오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        role: "pending",
        client_id: null,
        display_name: name,
        email: authData.user.email ?? trimmedEmail,
        company_name: company || null,
        phone: phone.trim() || null,
        must_change_password: false,
      });

      if (insertError) {
        setError(insertError.message || "프로필 등록에 실패했습니다.");
        setLoading(false);
        return;
      }

      // #region agent log
      fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
        body: JSON.stringify({
          sessionId: "f446e0",
          location: "signup/page.tsx:before-redirect",
          message: "Signup success, before router.push",
          data: { hasUser: !!authData.user },
          timestamp: Date.now(),
          hypothesisId: "H2",
        }),
      }).catch(() => {});
      // #endregion
      router.push("/login?registered=1");
      router.refresh();
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7810/ingest/2774bd9c-1201-4e20-b252-2831d892fdf5", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f446e0" },
        body: JSON.stringify({
          sessionId: "f446e0",
          location: "signup/page.tsx:catch",
          message: "Signup catch",
          data: { errMsg: err instanceof Error ? err.message : String(err) },
          timestamp: Date.now(),
          hypothesisId: "H2",
        }),
      }).catch(() => {});
      // #endregion
      setError("회원가입 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const legalDoc = legalModalKey ? LEGAL_DOCS[legalModalKey] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            O
          </div>
          <CardTitle className="text-xl">회원가입</CardTitle>
          <CardDescription>
            가입 후 관리자 승인 시 포털을 이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">회사/단체명</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="예: (주)원마케팅"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoComplete="organization"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">이름</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="담당자 이름을 입력하세요"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="예: 010-1234-5678"
                value={phone}
                onChange={handlePhoneChange}
                required
                autoComplete="tel"
                disabled={loading}
                maxLength={13}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="예: user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="6자 이상, 영문·숫자·특수문자 포함"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {(() => {
                    const r = passwordRules(password);
                    return (
                      <>
                        <li className={r.hasMinLength ? "text-green-600 dark:text-green-500 flex items-center gap-1" : "flex items-center gap-1"}>
                          {r.hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {PASSWORD_MIN_LENGTH}자 이상
                        </li>
                        <li className={r.hasLetter ? "text-green-600 dark:text-green-500 flex items-center gap-1" : "flex items-center gap-1"}>
                          {r.hasLetter ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          영문 포함
                        </li>
                        <li className={r.hasNumber ? "text-green-600 dark:text-green-500 flex items-center gap-1" : "flex items-center gap-1"}>
                          {r.hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          숫자 포함
                        </li>
                        <li className={r.hasSpecial ? "text-green-600 dark:text-green-500 flex items-center gap-1" : "flex items-center gap-1"}>
                          {r.hasSpecial ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          특수문자 포함
                        </li>
                      </>
                    );
                  })()}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                  aria-label={showPasswordConfirm ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground">약관 및 동의</p>
              <label className="flex items-center gap-3 cursor-pointer border-b border-border/60 pb-3">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => setAgreeAll(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm font-medium">전체 동의</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLegalModalKey("terms"); }}
                    className="text-primary hover:underline"
                  >
                    이용약관
                  </button>
                  에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLegalModalKey("privacy"); }}
                    className="text-primary hover:underline"
                  >
                    개인정보 수집 및 이용
                  </button>
                  에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <span className="text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setLegalModalKey("marketing"); }}
                    className="text-primary hover:underline"
                  >
                    마케팅 정보 수신
                  </button>
                  에 동의합니다 (선택)
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 처리 중...
                </>
              ) : (
                "가입 신청"
              )}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
      <Footer />

      <Dialog open={!!legalModalKey} onOpenChange={(open) => !open && setLegalModalKey(null)}>
        <DialogContent className="max-h-[85vh] flex flex-col gap-0 p-0 sm:max-w-lg">
          {legalDoc && (
            <>
              <DialogHeader className="shrink-0 border-b px-6 py-4">
                <DialogTitle className="text-base">{legalDoc.title}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                  {legalDoc.content}
                </pre>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
