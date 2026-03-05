import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="w-full bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
          마케팅을 한곳에서, 지금 시작하세요
        </h2>
        <p className="mt-4 text-muted-foreground">
          투명한 데이터와 올인원 기능으로 성과를 관리할 수 있습니다.
        </p>
        <Link href="/signup" className="inline-block mt-8">
          <Button size="lg" className="min-w-[180px]">
            지금 시작하기
          </Button>
        </Link>
      </div>
    </section>
  );
}
