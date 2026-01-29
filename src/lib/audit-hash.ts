import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

export function computeAuditHash(payload: unknown, prevHash: string | null): string {
  const body = JSON.stringify({ payload, prevHash });
  return createHmac("sha256", env.NEXTAUTH_SECRET).update(body).digest("hex");
}

