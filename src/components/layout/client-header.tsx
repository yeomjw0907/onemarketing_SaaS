"use client";

import { MobileMenuButton } from "./mobile-sidebar-wrapper";

export function ClientHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <MobileMenuButton />
    </header>
  );
}
