"use server";

import { auditPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function exportAuditLogs(params: {
  action?: string;
  actionContains?: string;
  resourceType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  resourceId?: string;
  skip?: number;
  take?: number;
}) {
  await requireAdmin();

  const where: any = {};
  if (params.action) where.action = params.action;
  else if (params.actionContains) where.action = { contains: params.actionContains, mode: "insensitive" };
  if (params.resourceType) where.resourceType = params.resourceType;
  if (params.actorId) where.actorId = params.actorId;
  if (params.resourceId) where.resourceId = params.resourceId;
  if (params.dateFrom || params.dateTo) {
    where.timestamp = {
      ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
      ...(params.dateTo ? { lte: new Date(params.dateTo) } : {})
    };
  }

  const rows = await auditPrisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    skip: typeof params.skip === "number" && params.skip > 0 ? params.skip : 0,
    take:
      typeof params.take === "number" && params.take > 0
        ? params.take
        : 5000
  });

  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp.toISOString(),
    actorId: r.actorId ?? "",
    actorRole: r.actorRole ?? "",
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId ?? "",
    ipAddress: r.ipAddress ?? "",
    userAgent: r.userAgent ?? ""
  }));
}

