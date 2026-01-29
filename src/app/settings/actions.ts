"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, auditPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

const UpdateLanguageSchema = z.object({
  language: z.string().min(2).max(10)
});

export async function updateUserLanguage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = UpdateLanguageSchema.safeParse({
    language: String(formData.get("language") ?? "")
  });

  if (!parsed.success) return;

  const { language } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: actorId } });
  if (!user) return;

  const newPreferences = { ...(user.preferences as object), language };

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.user.update({
        where: { id: actorId },
        data: { preferences: newPreferences }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "USER_LANGUAGE_UPDATED",
    resourceType: "User",
    resourceId: actorId,
    oldValue: { language: (user.preferences as any)?.language },
    newValue: { language }
  });

  revalidatePath("/settings");
}

const UpdateCurrencySchema = z.object({
  currency: z.string().min(3).max(3).transform((s) => s.toUpperCase())
});

export async function updateUserCurrency(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = UpdateCurrencySchema.safeParse({
    currency: String(formData.get("currency") ?? "")
  });

  if (!parsed.success) return;

  const { currency } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: actorId } });
  if (!user) return;

  const exists = (await auditPrisma!.$queryRaw<any[]>`SELECT code FROM "Currency" WHERE code = ${currency} AND active = true LIMIT 1`)[0];
  if (!exists) return;

  const newPreferences = { ...(user.preferences as object), currency };

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.user.update({
        where: { id: actorId },
        data: { preferences: newPreferences }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "USER_CURRENCY_UPDATED",
    resourceType: "User",
    resourceId: actorId,
    oldValue: { currency: (user.preferences as any)?.currency },
    newValue: { currency }
  });

  revalidatePath("/settings");
}

const ProfilePrivacyValueSchema = z.enum(["private", "public", "connections"]);

const UpdateUserProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z
    .string()
    .max(50)
    .regex(/^[+0-9\-()\s]*$/)
    .optional(),
  jobTitle: z.string().max(120).optional(),
  company: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  website: z.string().url().max(200).optional(),
  bio: z.string().max(1000).optional(),
  newsletter: z.enum(["on", "off"]).optional(),
  marketingEmails: z.enum(["on", "off"]).optional(),
  contactMethod: z.enum(["email", "phone", "none"]).optional(),
  privacy_name: ProfilePrivacyValueSchema.optional(),
  privacy_email: ProfilePrivacyValueSchema.optional(),
  privacy_phone: ProfilePrivacyValueSchema.optional(),
  privacy_jobTitle: ProfilePrivacyValueSchema.optional(),
  privacy_company: ProfilePrivacyValueSchema.optional(),
  privacy_location: ProfilePrivacyValueSchema.optional(),
  privacy_website: ProfilePrivacyValueSchema.optional(),
  privacy_bio: ProfilePrivacyValueSchema.optional(),
  challengeId: z.string().min(1),
  twoFactorCode: z.string().min(6).max(6)
});

export async function requestProfileChangeCode() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  const challenge = await prisma.profileChangeChallenge.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    }
  });

  await appendAuditLog({
    actorId: userId,
    actorRole,
    action: "USER_PROFILE_2FA_CODE_ISSUED",
    resourceType: "User",
    resourceId: userId,
    metadata: { challengeId: challenge.id }
  });

  const codeForDisplay = process.env.NODE_ENV === "development" ? code : null;

  return { challengeId: challenge.id, code: codeForDisplay };
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = UpdateUserProfileSchema.safeParse({
    name: String(formData.get("name") ?? "") || undefined,
    phone: String(formData.get("phone") ?? "") || undefined,
    jobTitle: String(formData.get("jobTitle") ?? "") || undefined,
    company: String(formData.get("company") ?? "") || undefined,
    location: String(formData.get("location") ?? "") || undefined,
    website: String(formData.get("website") ?? "") || undefined,
    bio: String(formData.get("bio") ?? "") || undefined,
    newsletter: formData.get("newsletter") ? "on" : "off",
    marketingEmails: formData.get("marketingEmails") ? "on" : "off",
    contactMethod: String(formData.get("contactMethod") ?? "none") || "none",
    privacy_name: String(formData.get("privacy_name") ?? "") || undefined,
    privacy_email: String(formData.get("privacy_email") ?? "") || undefined,
    privacy_phone: String(formData.get("privacy_phone") ?? "") || undefined,
    privacy_jobTitle: String(formData.get("privacy_jobTitle") ?? "") || undefined,
    privacy_company: String(formData.get("privacy_company") ?? "") || undefined,
    privacy_location: String(formData.get("privacy_location") ?? "") || undefined,
    privacy_website: String(formData.get("privacy_website") ?? "") || undefined,
    privacy_bio: String(formData.get("privacy_bio") ?? "") || undefined,
    challengeId: String(formData.get("challengeId") ?? ""),
    twoFactorCode: String(formData.get("twoFactorCode") ?? "")
  });

  if (!parsed.success) {
    return { ok: false, error: "Invalid data" };
  }

  const { challengeId, twoFactorCode } = parsed.data;

  const challenge = await prisma.profileChangeChallenge.findUnique({
    where: { id: challengeId }
  });

  if (!challenge || challenge.userId !== actorId || challenge.expiresAt < new Date()) {
    return { ok: false, error: "Invalid or expired security code" };
  }

  const codeOk = await bcrypt.compare(twoFactorCode, challenge.codeHash);
  if (!codeOk) {
    await prisma.profileChangeChallenge.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } }
    });
    return { ok: false, error: "Invalid security code" };
  }

  const user = await prisma.user.findUnique({ where: { id: actorId } });
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const preferences = {
    ...(user.preferences as any),
    newsletter: parsed.data.newsletter === "on",
    marketingEmails: parsed.data.marketingEmails === "on",
    contactMethod: parsed.data.contactMethod
  };

  const profilePrivacy = {
    ...(user.profilePrivacy as any),
    name: parsed.data.privacy_name ?? (user.profilePrivacy as any)?.name,
    email: parsed.data.privacy_email ?? (user.profilePrivacy as any)?.email,
    phone: parsed.data.privacy_phone ?? (user.profilePrivacy as any)?.phone,
    jobTitle: parsed.data.privacy_jobTitle ?? (user.profilePrivacy as any)?.jobTitle,
    company: parsed.data.privacy_company ?? (user.profilePrivacy as any)?.company,
    location: parsed.data.privacy_location ?? (user.profilePrivacy as any)?.location,
    website: parsed.data.privacy_website ?? (user.profilePrivacy as any)?.website,
    bio: parsed.data.privacy_bio ?? (user.profilePrivacy as any)?.bio
  };

  const avatarFile = formData.get("avatar") as File | null;
  const coverFile = formData.get("cover") as File | null;

  let avatarUrl: string | null = null;
  let coverUrl: string | null = null;

  if (avatarFile && avatarFile.size > 0) {
    const url = await (await import("@/lib/file-upload")).saveUploadedFile(
      avatarFile,
      "media"
    );
    if (url) avatarUrl = url;
  }

  if (coverFile && coverFile.size > 0) {
    const url = await (await import("@/lib/file-upload")).saveUploadedFile(
      coverFile,
      "media"
    );
    if (url) coverUrl = url;
  }

  const dataToUpdate: any = {
    preferences,
    profilePrivacy
  };

  if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name;
  if (parsed.data.phone !== undefined) dataToUpdate.phone = parsed.data.phone;
  if (parsed.data.jobTitle !== undefined) dataToUpdate.jobTitle = parsed.data.jobTitle;
  if (parsed.data.company !== undefined) dataToUpdate.company = parsed.data.company;
  if (parsed.data.location !== undefined) dataToUpdate.location = parsed.data.location;
  if (parsed.data.website !== undefined) dataToUpdate.website = parsed.data.website;
  if (parsed.data.bio !== undefined) dataToUpdate.bio = parsed.data.bio;
  if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl;
  if (coverUrl) dataToUpdate.coverUrl = coverUrl;

  const oldValue = {
    name: user.name,
    phone: user.phone,
    jobTitle: user.jobTitle,
    company: user.company,
    location: user.location,
    website: user.website,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    preferences: user.preferences,
    profilePrivacy: user.profilePrivacy
  };

  const updated = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.user.update({
        where: { id: actorId },
        data: dataToUpdate
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "USER_PROFILE_UPDATED",
    resourceType: "User",
    resourceId: actorId,
    oldValue,
    newValue: {
      name: updated.name,
      phone: updated.phone,
      jobTitle: updated.jobTitle,
      company: updated.company,
      location: updated.location,
      website: updated.website,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      coverUrl: updated.coverUrl,
      preferences: updated.preferences,
      profilePrivacy: updated.profilePrivacy
    },
    metadata: { via: "settings" }
  });

  await prisma.profileChangeChallenge.delete({ where: { id: challengeId } });

  revalidatePath("/settings");

  return { ok: true };
}
