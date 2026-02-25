import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "사용자 데이터 삭제 안내 | Onecation",
  description: "원마케팅·원케이션 서비스에서 본인 데이터 삭제 요청 방법",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← 홈
            </Button>
          </Link>
        </div>
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">사용자 데이터 삭제 안내</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            원마케팅·원케이션(Onecation) 서비스에서 수집·저장된 본인 데이터를 삭제하고 싶으시면 아래 방법으로 요청하실 수 있습니다.
          </p>

          <section className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <h2 className="font-medium text-foreground">1. 회원 탈퇴(계정 삭제)로 삭제</h2>
            <p>
              로그인 후 <strong>마이페이지</strong> 또는 <strong>설정</strong>에서 회원 탈퇴를 진행하시면, 해당 계정과 연결된 개인정보 및 서비스 이용 데이터는 개인정보 처리방침에 따라 지체 없이 파기됩니다.
            </p>

            <h2 className="font-medium text-foreground">2. 삭제 요청 문의</h2>
            <p>
              특정 데이터만 삭제를 원하시거나, 탈퇴 외의 방법으로 삭제를 요청하시려면 아래 연락처로 문의해 주세요. 요청하신 내용에 대해 확인 후 처리해 드립니다.
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li><strong>이메일:</strong> yeomjw0907@onecation.co.kr</li>
              <li><strong>담당:</strong> 개인정보 보호책임자</li>
            </ul>

            <h2 className="font-medium text-foreground">3. Facebook·Meta 연동 데이터</h2>
            <p>
              Facebook( Meta ) 로그인 또는 Meta 관련 연동을 통해 저장된 데이터도 위 1·2와 동일한 방법으로 삭제를 요청하실 수 있습니다. 회원 탈퇴 또는 삭제 요청 처리 시 해당 연동 정보를 포함해 파기합니다.
            </p>

            <p className="mt-6 text-xs text-muted-foreground">
              자세한 수집·이용·파기 기준은 <Link href="/privacy" className="underline hover:text-foreground">개인정보 처리방침</Link>을 참고해 주세요.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
