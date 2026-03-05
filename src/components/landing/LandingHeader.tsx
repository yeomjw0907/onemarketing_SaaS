"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo-light.png" alt="ONEmarketing" className="h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">회원가입</Button>
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="메뉴 열기"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-2">
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">로그인</Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">회원가입</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
