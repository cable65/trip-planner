import { headers } from "next/headers";
import { auditPrisma } from "@/lib/prisma";
import { computeAuditHash } from "@/lib/audit-hash";

type HeaderLike = { get(name: string): string | null };

function getIpAddress(h: HeaderLike): string | null {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return h.get("x-real-ip");
}

export async function appendAuditLog(input: {
  actorId: string | null;
  actorRole: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const h = await headers();
  const ipAddress = getIpAddress(h);
  const userAgent = h.get("user-agent");
  const last = await auditPrisma.auditLog.findFirst({
    orderBy: { timestamp: "desc" },
    select: { entryHash: true }
  });
  const prevHash = last?.entryHash ?? null;

  const payload = {
    ...input,
    ipAddress,
    userAgent
  };

  const entryHash = computeAuditHash(payload, prevHash);

  await auditPrisma.auditLog.create({
    data: {
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      ipAddress,
      userAgent,
      oldValue: (input.oldValue ?? null) as any,
      newValue: (input.newValue ?? null) as any,
      metadata: (input.metadata ?? {}) as any,
      prevHash,
      entryHash
    }
  });
}

