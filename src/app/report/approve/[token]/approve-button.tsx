"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Props {
  token: string;
  viewToken: string | null;
}

export function ApproveButton({ token, viewToken }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const handleApprove = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/report/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "승인 처리에 실패했습니다.");
        setState("error");
        return;
      }
      setMessage(data.message ?? "승인되었습니다.");
      setState("done");
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="space-y-3">
        <p className="text-center text-green-600 font-medium flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {message}
        </p>
        {viewToken && (
          <Button asChild className="w-full">
            <Link href={`/report/v/${viewToken}`}>자세히 보기</Link>
          </Button>
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <p className="text-center text-destructive text-sm" role="alert">
        {message}
      </p>
    );
  }

  return (
    <Button
      className="w-full"
      onClick={handleApprove}
      disabled={state === "loading"}
    >
      {state === "loading" ? "처리 중..." : "승인하기"}
    </Button>
  );
}
