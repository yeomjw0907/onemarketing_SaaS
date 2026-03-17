"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
}

interface Props {
  announcements: Announcement[];
}

export function NoticesClient({ announcements }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (announcements.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">공지 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="table w-full min-w-[400px] text-sm" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left font-medium py-3 px-4 w-16 shrink-0 text-muted-foreground whitespace-nowrap">번호</th>
                  <th className="text-left font-medium py-3 px-4 text-muted-foreground">제목</th>
                  <th className="text-left font-medium py-3 px-4 w-28 shrink-0 text-muted-foreground">등록일</th>
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
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">공지 목록</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="table w-full min-w-[400px] text-sm" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left font-medium py-3 px-4 w-16 shrink-0 text-muted-foreground whitespace-nowrap">번호</th>
                <th className="text-left font-medium py-3 px-4 text-muted-foreground">제목</th>
                <th className="text-left font-medium py-3 px-4 w-28 shrink-0 text-muted-foreground">등록일</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item, idx) => (
                <>
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer select-none"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  >
                    <td className="py-3 px-4 text-muted-foreground text-xs">{announcements.length - idx}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.is_pinned && (
                          <Pin className="h-3 w-3 shrink-0 text-primary" />
                        )}
                        <span className="font-medium truncate">{item.title}</span>
                        {item.is_pinned && (
                          <Badge variant="outline" className="text-[10px] shrink-0">고정</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span>{formatDate(item.created_at)}</span>
                        {item.content && (
                          openId === item.id
                            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </td>
                  </tr>
                  {openId === item.id && item.content && (
                    <tr key={`${item.id}-body`} className="border-b last:border-0 bg-muted/20">
                      <td />
                      <td colSpan={2} className="px-4 py-4 text-sm text-foreground/80 whitespace-pre-wrap">
                        {item.content}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
