"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ClientHeaderProps {
  displayName: string;
}

export function ClientHeader({ displayName }: ClientHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{displayName}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
