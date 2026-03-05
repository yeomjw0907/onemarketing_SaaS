"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Section } from "./Section";
import { LayoutDashboard, MessageSquare, FolderKanban } from "lucide-react";

const ROTATE_INTERVAL_MS = 4500;
const PROGRESS_TICK_MS = 50;

const features = [
  {
    id: "channel",
    title: "다채널 광고 성과",
    description: "Google Ads · GA4 · Meta 연동을 한 대시보드에서 조회할 수 있습니다.",
    icon: LayoutDashboard,
    gradient: "from-blue-500/10 to-transparent",
    image: "/landing/feature-channel.png",
  },
  {
    id: "kakao",
    title: "카카오톡 매주 3회 정기 보고",
    description: "월요일 리뷰 · 수요일 예산 · 목요일 제안을 카카오톡으로 자동 발송합니다.",
    icon: MessageSquare,
    gradient: "from-amber-500/10 to-transparent",
    image: "/landing/feature-kakao.png",
  },
  {
    id: "progress",
    title: "마케팅 프로젝트 진척도",
    description: "진행 단계(stage)와 진척률(%)로 마케팅 프로젝트를 한눈에 관리할 수 있습니다.",
    icon: FolderKanban,
    gradient: "from-emerald-500/10 to-transparent",
    image: "/landing/feature-progress.png",
  },
];

export function LandingFeaturePrimary() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const goTo = useCallback((i: number) => {
    setIndex((i + features.length) % features.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  // interval은 paused에만 반응. index 변경 시에는 끊지 않아서 progress bar가 멈추지 않음.
  useEffect(() => {
    if (paused) return;
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const t = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(100, (elapsed / ROTATE_INTERVAL_MS) * 100);
      setProgress(p);
      if (p >= 100) {
        setIndex((prev) => (prev + 1) % features.length);
        setProgress(0);
        startTimeRef.current = Date.now();
      }
    }, PROGRESS_TICK_MS);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <Section id="features" className="scroll-mt-20">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <p className="text-sm font-medium text-primary">핵심 기능</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl mt-2">
          마케팅 통합 관리 솔루션
        </h2>
        <p className="text-muted-foreground mt-4">
          원케이션이 직접 개발한 ONEmarketing으로{" "}
          <strong className="text-foreground">다채널 연동 성과</strong>, 매주 3회
          카카오톡 정기 보고, 주간·월간 리포트 발행·알림, 마케팅 프로젝트 진척도까지
          한곳에서 관리할 수 있습니다.
        </p>
      </div>

      <div
        className="mt-12 md:mt-16 w-full max-w-5xl mx-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* 위: 이미지 1개 (활성 슬라이드에 따라 전환) */}
        <div className="relative rounded-xl border border-border bg-muted/30 overflow-hidden aspect-video w-full">
          {features.map((item, i) => {
            const isActive = i === index;
            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  isActive ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={!isActive}
              >
                <div
                  className={`absolute right-0 bottom-0 w-full h-full bg-gradient-to-br ${item.gradient}`}
                  aria-hidden
                />
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pt-4">
                    (이미지 추가 예정)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 밑: 연결된 progress bar 1개 + 설명 3개 */}
        <div className="mt-8 md:mt-10 overflow-hidden rounded-xl border border-border">
          {/* 전체를 가로로 채우는 progress bar (3구간 = 3카드) */}
          <div className="h-1 w-full bg-muted-foreground/20">
            <div
              className="h-full bg-primary transition-[width] duration-150 ease-linear"
              style={{ width: `${(index + progress / 100) * (100 / features.length)}%` }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
            {features.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`text-center sm:text-left border-r border-border last:sm:border-r-0 p-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? "bg-primary/5 z-10"
                      : "bg-card hover:bg-muted/30"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`${item.title} 보기`}
                >
                  <div className="flex justify-center sm:justify-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
