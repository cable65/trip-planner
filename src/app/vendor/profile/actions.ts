"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit"; // Assuming these exist from previous context
import { getRequestMetadata } from "@/lib/request-metadata";
import { saveUploadedFile } from "@/lib/file-upload";

const UpdateProfileSchema = z.object({
  intro: z.string().optional(),
});

export async function updateVendorProfile(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  if (actorRole !== "vendor") {
    throw new Error("Unauthorized");
  }

  const parsed = UpdateProfileSchema.safeParse({
    intro: formData.get("intro") as string
  });

  if (!parsed.success) return { error: "Invalid data" };

  const logoFile = formData.get("logo") as File | null;
  const bannerFile = formData.get("banner") as File | null;

  let logoUrl: string | undefined;
  let bannerUrl: string | undefined;

  try {
    if (logoFile && logoFile.size > 0) {
      const url = await saveUploadedFile(logoFile, "logo");
      if (url) logoUrl = url;
    }
    if (bannerFile && bannerFile.size > 0) {
      const url = await saveUploadedFile(bannerFile, "banner");
      if (url) bannerUrl = url;
    }
  } catch (e: any) {
    return { error: e.message };
  }

  const currentProfile = await prisma.vendorProfile.findUnique({ where: { userId: actorId } });
  
  const dataToUpdate: any = {
    intro: parsed.data.intro,
  };
  if (logoUrl) dataToUpdate.logoUrl = logoUrl;
  if (bannerUrl) dataToUpdate.bannerUrl = bannerUrl;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const newProfile = await prisma.vendorProfile.upsert({
        where: { userId: actorId },
        update: dataToUpdate,
        create: {
          userId: actorId,
          ...dataToUpdate,
          isApproved: false // Default to false
        }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "VENDOR_PROFILE_UPDATED",
        resourceType: "VendorProfile",
        resourceId: newProfile.id,
        oldValue: currentProfile as any,
        newValue: newProfile as any,
        metadata: {
            updatedFields: Object.keys(dataToUpdate)
        }
      });
    }
  );

  revalidatePath("/vendor/profile");
  return { success: true };
}
