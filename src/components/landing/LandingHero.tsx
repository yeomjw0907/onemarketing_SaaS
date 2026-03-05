import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      </Section>
    </section>
  );
}
