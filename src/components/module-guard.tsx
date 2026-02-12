import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export function ModuleDisabled() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">모듈이 비활성화되어 있습니다</h2>
          <p className="text-sm text-muted-foreground text-center">
            이 모듈은 현재 플랜에서 사용할 수 없습니다.<br />
            담당자에게 문의해 주세요.
          </p>
          <Button asChild variant="outline">
            <Link href="/support">문의하기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
