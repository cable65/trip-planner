"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";
import { saveUploadedFile } from "@/lib/file-upload";

const SubmitQuoteSchema = z.object({
  shareId: z.string().min(1),
  price: z.coerce.number().positive(),
  currency: z.string().min(3).max(3),
  notes: z.string().max(500).optional(),
});

export async function submitQuote(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = SubmitQuoteSchema.safeParse({
    shareId: String(formData.get("shareId") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) return { error: "Invalid data" };

  const { shareId, price, currency, notes } = parsed.data;

  const share = await prisma.tripShare.findUnique({ where: { id: shareId } });
  if (!share) return { error: "Request not found" };

  if (new Date(share.expiresAt) < new Date()) {
    return { error: "Request has expired" };
  }

  // Handle attachments
  const attachments: string[] = [];
  const file = formData.get("attachment") as File | null;
  if (file && file.size > 0) {
    try {
      const url = await saveUploadedFile(file, "document");
      if (url) attachments.push(url);
    } catch (e: any) {
      return { error: e.message };
    }
  }

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const quote = await prisma.quote.create({
        data: {
          tripShareId: shareId,
          price,
          currency,
          notes,
          attachments: attachments, // JSON
          status: "PENDING"
        }
      });

      await prisma.tripShare.update({
        where: { id: shareId },
        data: { status: "RESPONDED" }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "QUOTE_SUBMITTED",
        resourceType: "Quote",
        resourceId: quote.id,
        oldValue: null,
        newValue: { price, currency, notes, attachments }
      });
    }
  );

  redirect("/vendor/dashboard");
}
