export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* 상단 로고 바 */}
      <header className="border-b bg-background/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            O
          </div>
          <span className="font-semibold text-sm">ONEmarketing 시작하기</span>
        </div>
      </header>
      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
