import crypto from "crypto";

const VIEW_TOKEN_VALID_DAYS = 7;
const APPROVAL_TOKEN_VALID_DAYS = 3;

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getViewTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + VIEW_TOKEN_VALID_DAYS);
  return d;
}

export function getApprovalTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + APPROVAL_TOKEN_VALID_DAYS);
  return d;
}

export function buildViewUrl(viewToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base.replace(/\/$/, "")}/report/v/${viewToken}`;
}

export function buildApproveUrl(approvalToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base.replace(/\/$/, "")}/report/approve/${approvalToken}`;
}
