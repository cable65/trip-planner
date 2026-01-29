"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { headers } from "next/headers";
import { saveUploadedFile } from "@/lib/file-upload";
import { revalidatePath } from "next/cache";
import { getRequestMetadata } from "@/lib/request-metadata";

const CreatePackageSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  priceCents: z.coerce.number().int().positive(),
  commissionRate: z.coerce.number().int().min(0).max(100).default(0),
  media: z.string().transform((s) => {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }),
  components: z.string().transform((s) => {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })
});

export async function createVendorPackage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  if (actorRole !== "vendor") return;

  const parsed = CreatePackageSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceCents: String(formData.get("priceCents") ?? ""),
    commissionRate: String(formData.get("commissionRate") ?? "0"),
    media: String(formData.get("media") ?? "[]"),
    components: String(formData.get("components") ?? "[]")
  });
  if (!parsed.success) return;

  // Handle file uploads
  const mediaFiles = formData.getAll("media_files");
  const uploadedUrls: string[] = [];
  for (const file of mediaFiles) {
    if (file instanceof File && file.size > 0) {
      try {
        const url = await saveUploadedFile(file, "media");
        if (url) uploadedUrls.push(url);
      } catch (e) {
        console.error("Failed to upload file:", e);
      }
    }
  }

  const finalMedia = [...(parsed.data.media as string[]), ...uploadedUrls];

  const h = await headers();
  const ipAddress = h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  const pkg = await runWithAuditContext({ actorId, actorRole, ipAddress, userAgent }, async () => {
    const created = await (prisma as any).vendorPackage.create({
      data: {
        vendorId: actorId,
        name: parsed.data.name,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        commissionRate: parsed.data.commissionRate,
        media: finalMedia as any
      }
    });

    const comps = (parsed.data.components as any[]).map((c) => ({
      packageId: created.id,
      type: c.type ?? "component",
      title: c.title ?? "",
      details: (c.details ?? {}) as any
    }));
    if (comps.length) await (prisma as any).packageComponent.createMany({ data: comps });
    return created;
  });

  await appendAuditLog({
    actorId,
    actorRole,
    action: "VENDOR_PACKAGE_CREATED",
    resourceType: "VendorPackage",
    resourceId: pkg.id,
    oldValue: null,
    newValue: { id: pkg.id, name: pkg.name }
  });
}

const UpdatePackageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  priceCents: z.coerce.number().int().positive(),
  commissionRate: z.coerce.number().int().min(0).max(100),
  media: z.string().transform((s) => {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })
});

export async function updateVendorPackage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  if (actorRole !== "vendor") return;

  const parsed = UpdatePackageSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceCents: String(formData.get("priceCents") ?? ""),
    commissionRate: String(formData.get("commissionRate") ?? "0"),
    media: String(formData.get("media") ?? "[]")
  });
  if (!parsed.success) return;

  const { id, name, description, priceCents, commissionRate, media } = parsed.data;

  // Verify ownership
  const existing = await (prisma as any).vendorPackage.findFirst({
    where: { id, vendorId: actorId }
  });
  if (!existing) return;

  const h = await headers();
  const ipAddress = h.get("x-real-ip");
  const userAgent = h.get("user-agent");

  await runWithAuditContext({ actorId, actorRole, ipAddress, userAgent }, async () => {
    await (prisma as any).vendorPackage.update({
      where: { id },
      data: {
        name,
        description,
        priceCents,
        commissionRate,
        media: media as any,
        isApproved: false // Reset approval on edit
      }
    });
  });

  await appendAuditLog({
    actorId,
    actorRole,
    action: "VENDOR_PACKAGE_UPDATED",
    resourceType: "VendorPackage",
    resourceId: id,
    oldValue: { name: existing.name, price: existing.priceCents },
    newValue: { name, price: priceCents, isApproved: false }
  });
}

const AddAvailabilitySchema = z.object({
  packageId: z.string().min(1),
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  quantity: z.coerce.number().int().min(1)
});

export async function addAvailability(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  
  const parsed = AddAvailabilitySchema.safeParse({
    packageId: String(formData.get("packageId") ?? ""),
    dateFrom: String(formData.get("dateFrom") ?? ""),
    dateTo: String(formData.get("dateTo") ?? ""),
    quantity: String(formData.get("quantity") ?? "1")
  });
  
  if (!parsed.success) return;
  const { packageId, dateFrom, dateTo, quantity } = parsed.data;

  // Validate dates
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
    return;
  }

  // Verify ownership
  const pkg = await (prisma as any).vendorPackage.findFirst({
    where: { id: packageId, vendorId: actorId }
  });
  if (!pkg) return;

  // Generate individual daily records
  const availabilityData = [];
  const current = new Date(startDate);
  // Limit to 730 days (2 years) to prevent abuse
  const limitDate = new Date(startDate);
  limitDate.setDate(limitDate.getDate() + 730);

  while (current <= endDate && current <= limitDate) {
    availabilityData.push({
      packageId,
      dateFrom: new Date(current),
      dateTo: new Date(current),
      quantity
    });
    current.setDate(current.getDate() + 1);
  }

  if (availabilityData.length > 0) {
    await (prisma as any).packageAvailability.createMany({
      data: availabilityData
    });
  }

  revalidatePath(`/vendor/packages/${packageId}`);
}

export async function archivePackage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const packageId = String(formData.get("packageId") ?? "");

  const pkg = await (prisma as any).vendorPackage.findFirst({
    where: { id: packageId, vendorId: actorId }
  });

  if (!pkg) return;

  const { ipAddress, userAgent } = await getRequestMetadata();

  await runWithAuditContext({ actorId, actorRole, ipAddress, userAgent }, async () => {
    await (prisma as any).vendorPackage.update({
      where: { id: packageId },
      data: { isArchived: true }
    });
  });

  await appendAuditLog({
    actorId,
    actorRole,
    action: "VENDOR_PACKAGE_ARCHIVED",
    resourceType: "VendorPackage",
    resourceId: packageId,
    oldValue: { isArchived: false },
    newValue: { isArchived: true }
  });

  revalidatePath("/vendor/packages");
}

export async function unarchivePackage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const packageId = String(formData.get("packageId") ?? "");

  const pkg = await (prisma as any).vendorPackage.findFirst({
    where: { id: packageId, vendorId: actorId }
  });

  if (!pkg) return;

  const { ipAddress, userAgent } = await getRequestMetadata();

  await runWithAuditContext({ actorId, actorRole, ipAddress, userAgent }, async () => {
    await (prisma as any).vendorPackage.update({
      where: { id: packageId },
      data: { isArchived: false }
    });
  });

  await appendAuditLog({
    actorId,
    actorRole,
    action: "VENDOR_PACKAGE_UNARCHIVED",
    resourceType: "VendorPackage",
    resourceId: packageId,
    oldValue: { isArchived: true },
    newValue: { isArchived: false }
  });

  revalidatePath("/vendor/packages");
}

export async function removeAvailability(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const id = String(formData.get("id") ?? "");
  const packageId = String(formData.get("packageId") ?? "");

  // Verify ownership via package
  const pkg = await (prisma as any).vendorPackage.findFirst({
    where: { id: packageId, vendorId: actorId }
  });
  if (!pkg) return;

  await (prisma as any).packageAvailability.delete({ where: { id } });

  revalidatePath(`/vendor/packages/${packageId}`);
}

