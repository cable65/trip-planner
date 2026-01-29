import { Prisma, PrismaClient } from "@prisma/client";
import { computeAuditHash } from "@/lib/audit-hash";
import { getAuditContext } from "@/lib/audit-context";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaRaw: PrismaClient | undefined;
  var auditPrisma: PrismaClient | undefined;
}

export const auditPrisma = globalThis.auditPrisma ?? new PrismaClient();
globalThis.auditPrisma = auditPrisma;

const prismaRaw = globalThis.prismaRaw ?? new PrismaClient();
globalThis.prismaRaw = prismaRaw;

const auditedModels = new Set<Prisma.ModelName>([
  "User",
  "Trip",
  "Booking",
  "Payment",
  "Review"
]);

const auditedOperations = new Set(["create", "update", "delete", "upsert"]);

const prismaExtended = prismaRaw.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || model === "AuditLog") return query(args);
        if (!auditedModels.has(model)) return query(args);
        if (!auditedOperations.has(operation)) return query(args);

        const ctx = getAuditContext();

        const where = (args as any)?.where;
        const resourceId = typeof where?.id === "string" ? where.id : null;

        const oldValue =
          operation === "update" || operation === "delete" || operation === "upsert"
            ? resourceId
              ? await (auditPrisma as any)[model].findUnique({ where: { id: resourceId } })
              : null
            : null;

        const result = await query(args);
        const newValue = operation === "delete" ? null : result;

        const last = await auditPrisma.auditLog.findFirst({
          orderBy: { timestamp: "desc" },
          select: { entryHash: true }
        });

        const payload = {
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          action: `DB_${model}_${operation.toUpperCase()}`,
          resourceType: model,
          resourceId: (result as any)?.id ?? resourceId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          oldValue,
          newValue,
          metadata: { source: "prisma" }
        };

        const prevHash = last?.entryHash ?? null;
        const entryHash = computeAuditHash(payload, prevHash);

        await auditPrisma.auditLog.create({
          data: {
            actorId: payload.actorId,
            actorRole: payload.actorRole,
            action: payload.action,
            resourceType: payload.resourceType,
            resourceId: payload.resourceId,
            ipAddress: payload.ipAddress,
            userAgent: payload.userAgent,
            oldValue: payload.oldValue as any,
            newValue: payload.newValue as any,
            metadata: payload.metadata as any,
            prevHash,
            entryHash
          }
        });

        return result;
      }
    }
  }
});

export const prisma = globalThis.prisma ?? (prismaExtended as unknown as PrismaClient);
globalThis.prisma = prisma;

