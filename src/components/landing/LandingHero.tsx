import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
import { Section } from "./Section";

export function LandingHero() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Section className="flex flex-col items-center justify-center text-center py-16 md:py-24 lg:py-28">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl max-w-3xl">
          마케팅 올인원 관리 서비스
          <br />
          <span className="text-primary">원마케팅으로</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl sm:text-xl">
          데이터 100% 소유, 투명한 성과 측정.
          <br className="hidden sm:block" />
          마케팅을 한곳에서 쉽게 관리하세요.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto min-w-[160px]">
              지금 시작하기
            </Button>
          </Link>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px w-12 bg-border" />
          <span className="text-sm text-muted-foreground">또는</span>
          <div className="h-px w-12 bg-border" />
        </div>
        <Link href="/free-report" className="mt-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/5 px-5 py-2 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-500/10 hover:border-pink-500/50">
          <Instagram className="h-4 w-4" />
          내 인스타그램 성과 무료로 확인하기 →
        </Link>
      </Section>
    </section>
  );
}
