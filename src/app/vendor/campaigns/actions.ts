"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";

const CreateCampaignSchema = z.object({
  name: z.string().min(2).max(120),
  subject: z.string().min(2).max(160),
  content: z.string().min(2),
  scheduledAt: z.string().optional(),
  target: z.string().optional() // JSON string
});

export async function createCampaign(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = CreateCampaignSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    content: String(formData.get("content") ?? ""),
    scheduledAt: String(formData.get("scheduledAt") ?? "") || undefined,
    target: String(formData.get("target") ?? "") || undefined
  });

  if (!parsed.success) return { error: "Invalid data" };
  const { name, subject, content, scheduledAt, target } = parsed.data;

  const targetJson = (() => {
    try { return target ? JSON.parse(target) : {}; } catch { return {}; }
  })();

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : undefined;

  const campaign = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const created = await prisma.campaign.create({
        data: {
          vendorId: actorId,
          name,
          subject,
          content,
          status: scheduledDate ? "scheduled" : "draft",
          scheduledAt: scheduledDate,
          target: targetJson
        }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "CAMPAIGN_CREATED",
        resourceType: "Campaign",
        resourceId: created.id,
        oldValue: null,
        newValue: { name, subject, scheduledAt: scheduledDate ?? null, target: targetJson }
      });

      return created;
    }
  );

  revalidatePath("/vendor/campaigns");
  return { id: campaign.id };
}

const UpdateStatusSchema = z.object({
  id: z.string().min(1)
});

export async function cancelCampaign(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = UpdateStatusSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: "Invalid data" };
  const { id } = parsed.data;

  const existing = await prisma.campaign.findFirst({ where: { id, vendorId: actorId } });
  if (!existing) return { error: "Not found" };

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const updated = await prisma.campaign.update({ where: { id }, data: { status: "cancelled" } });
      await appendAuditLog({
        actorId,
        actorRole,
        action: "CAMPAIGN_CANCELLED",
        resourceType: "Campaign",
        resourceId: id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status }
      });
    }
  );

  revalidatePath("/vendor/campaigns");
}

const CreateVariationSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  target: z.string().optional()
});

export async function createVariation(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = CreateVariationSchema.safeParse({
    campaignId: String(formData.get("campaignId") ?? ""),
    name: String(formData.get("name") ?? ""),
    content: String(formData.get("content") ?? ""),
    target: String(formData.get("target") ?? "")
  });

  if (!parsed.success) throw new Error("Invalid data");
  const { campaignId, name, content, target } = parsed.data;

  // Verify ownership
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, vendorId: actorId }
  });
  if (!campaign) throw new Error("Campaign not found");

  const targetJson = (() => {
    try { return target ? JSON.parse(target) : {}; } catch { return {}; }
  })();

  const variation = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const created = await prisma.campaignVariation.create({
        data: {
          campaignId,
          name,
          content,
          target: targetJson
        }
      });
      
      // Initialize metrics
      await prisma.variationMetric.create({
        data: { variationId: created.id }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "CAMPAIGN_VARIATION_CREATED",
        resourceType: "CampaignVariation",
        resourceId: created.id,
        oldValue: null,
        newValue: { name, content, target: targetJson },
        metadata: { campaignId }
      });
      return created;
    }
  );

  revalidatePath(`/vendor/campaigns/${campaignId}`);
}

const DeleteVariationSchema = z.object({
  variationId: z.string().min(1),
  campaignId: z.string().min(1)
});

export async function deleteVariation(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = DeleteVariationSchema.safeParse({
    variationId: String(formData.get("variationId") ?? ""),
    campaignId: String(formData.get("campaignId") ?? "")
  });

  if (!parsed.success) return;
  const { variationId, campaignId } = parsed.data;

  // Verify ownership
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, vendorId: actorId }
  });
  if (!campaign) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      await prisma.campaignVariation.delete({ where: { id: variationId } });
      await appendAuditLog({
        actorId,
        actorRole,
        action: "CAMPAIGN_VARIATION_DELETED",
        resourceType: "CampaignVariation",
        resourceId: variationId,
        oldValue: null,
        newValue: null,
        metadata: { campaignId }
      });
    }
  );

  revalidatePath(`/vendor/campaigns/${campaignId}`);
}

