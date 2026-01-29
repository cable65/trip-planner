"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth"; // Assuming I can create/use this
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";

const PackageActionSchema = z.object({
  packageId: z.string().min(1)
});

export async function approvePackage(formData: FormData) {
  const session = await requireAdmin(); // Ensure only admin
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = PackageActionSchema.safeParse({
    packageId: String(formData.get("packageId") ?? "")
  });

  if (!parsed.success) return;
  const { packageId } = parsed.data;

  const pkg = await (prisma as any).vendorPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      (prisma as any).vendorPackage.update({
        where: { id: packageId },
        data: { isApproved: true }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "PACKAGE_APPROVED",
    resourceType: "VendorPackage",
    resourceId: packageId,
    oldValue: { isApproved: pkg.isApproved },
    newValue: { isApproved: true }
  });

  revalidatePath("/admin/packages");
}

export async function rejectPackage(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = PackageActionSchema.safeParse({
    packageId: String(formData.get("packageId") ?? "")
  });

  if (!parsed.success) return;
  const { packageId } = parsed.data;

  const pkg = await (prisma as any).vendorPackage.findUnique({ where: { id: packageId } });
  if (!pkg) return;

  // Rejecting essentially means setting isApproved to false (or maybe deleting?)
  // For now, toggle back to false.
  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      (prisma as any).vendorPackage.update({
        where: { id: packageId },
        data: { isApproved: false }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "PACKAGE_REJECTED",
    resourceType: "VendorPackage",
    resourceId: packageId,
    oldValue: { isApproved: pkg.isApproved },
    newValue: { isApproved: false }
  });

  revalidatePath("/admin/packages");
}
