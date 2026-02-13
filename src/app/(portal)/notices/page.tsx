import type { Metadata } from "next";
import { requireClient } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "공지사항 | Onecation",
  description: "공지사항",
};

export default async function NoticesPage() {
  await requireClient();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" /> 공지사항
        </h1>
        <p className="text-muted-foreground text-sm mt-1">중요 공지를 확인하세요.</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">공지 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-medium py-3 px-4 w-14 text-muted-foreground">번호</th>
                  <th className="text-left font-medium py-3 px-4 text-muted-foreground">제목</th>
                  <th className="text-left font-medium py-3 px-4 w-28 text-muted-foreground">등록일</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-0">
                  <td colSpan={3} className="py-10 px-4 text-center text-muted-foreground">
                    등록된 공지사항이 없습니다. 중요 공지는 등록 시 이곳에서 안내드립니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
