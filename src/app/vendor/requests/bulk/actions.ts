"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";

const BulkSubmitSchema = z.object({
  shareIds: z.string().transform((s) => s.split(",").filter(Boolean)),
  price: z.coerce.number().positive(),
  currency: z.string().min(3).max(3),
  notes: z.string().max(500).optional()
});

export async function bulkSubmitQuotes(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = BulkSubmitSchema.safeParse({
    shareIds: String(formData.get("shareIds") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    notes: String(formData.get("notes") ?? "")
  });

  if (!parsed.success) return { error: "Invalid data" };
  const { shareIds, price, currency, notes } = parsed.data;

  const shares = await prisma.tripShare.findMany({
    where: { id: { in: shareIds }, vendorId: actorId, status: "PENDING" },
    select: { id: true, expiresAt: true }
  });

  const validShares = shares.filter((s) => new Date(s.expiresAt) > new Date());
  if (validShares.length === 0) return redirect("/vendor/dashboard");

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      for (const share of validShares) {
        const quote = await prisma.quote.create({
          data: {
            tripShareId: share.id,
            price,
            currency,
            notes,
            attachments: [],
            status: "PENDING"
          }
        });

        await prisma.tripShare.update({
          where: { id: share.id },
          data: { status: "RESPONDED" }
        });

        await appendAuditLog({
          actorId,
          actorRole,
          action: "QUOTE_SUBMITTED_BULK",
          resourceType: "Quote",
          resourceId: quote.id,
          oldValue: null,
          newValue: { price, currency, notes, shareId: share.id },
          metadata: { bulk: true }
        });
      }
    }
  );

  redirect("/vendor/dashboard");
}

