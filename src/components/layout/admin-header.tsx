"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MobileMenuButton } from "./mobile-sidebar-wrapper";

export function AdminHeader({ displayName }: { displayName: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileMenuButton />
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">관리자 콘솔</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃" aria-label="로그아웃">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
