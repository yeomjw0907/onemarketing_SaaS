import { Badge } from "@/components/ui/badge";
import { ActionStatus, EventStatus, ProjectStage } from "@/lib/types/database";

const statusLabels: Record<string, string> = {
  planned: "계획됨",
  in_progress: "진행중",
  done: "완료",
  hold: "보류",
  planning: "기획",
  design: "디자인",
  dev: "개발",
  qa: "QA",
};

type StatusVariant = "done" | "planned" | "hold" | "in_progress" | "default" | "secondary" | "destructive" | "outline";

const statusVariantMap: Record<string, StatusVariant> = {
  planned: "planned",
  in_progress: "in_progress",
  done: "done",
  hold: "hold",
  planning: "planned",
  design: "in_progress",
  dev: "in_progress",
  qa: "hold",
};

export function StatusBadge({ status }: { status: ActionStatus | EventStatus | ProjectStage | string }) {
  const variant = statusVariantMap[status] || "secondary";
  const label = statusLabels[status] || status;
  return <Badge variant={variant}>{label}</Badge>;
}
