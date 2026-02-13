import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
          <p className="text-sm text-muted-foreground mt-1">
            요청하신 주소가 잘못되었거나 삭제된 페이지일 수 있습니다.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">홈으로</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/overview">클라이언트 개요</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin">관리자</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
