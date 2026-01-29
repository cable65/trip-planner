import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { appendAuditLog } from "@/lib/audit";

const PrivacySchema = z.enum(["private", "public", "connections"]).optional();

const UpdateProfileBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(50).regex(/^[+0-9\-()\s]*$/).optional(),
  jobTitle: z.string().max(120).optional(),
  company: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  website: z.string().url().max(200).optional(),
  bio: z.string().max(1000).optional(),
  preferences: z
    .object({
      newsletter: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      contactMethod: z.enum(["email", "phone", "none"]).optional()
    })
    .partial()
    .optional(),
  privacy: z
    .object({
      name: PrivacySchema,
      email: PrivacySchema,
      phone: PrivacySchema,
      jobTitle: PrivacySchema,
      company: PrivacySchema,
      location: PrivacySchema,
      website: PrivacySchema,
      bio: PrivacySchema
    })
    .partial()
    .optional()
});

export async function GET(req: NextRequest) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      jobTitle: true,
      company: true,
      location: true,
      website: true,
      bio: true,
      avatarUrl: true,
      coverUrl: true,
      preferences: true,
      profilePrivacy: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;

  const json = await req.json().catch(() => null);
  const parsed = UpdateProfileBodySchema.safeParse(json ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const preferences = {
    ...(existing.preferences as any),
    ...(parsed.data.preferences ?? {})
  };

  const profilePrivacy = {
    ...(existing.profilePrivacy as any),
    ...(parsed.data.privacy ?? {})
  };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name ?? existing.name,
      phone: parsed.data.phone ?? existing.phone,
      jobTitle: parsed.data.jobTitle ?? existing.jobTitle,
      company: parsed.data.company ?? existing.company,
      location: parsed.data.location ?? existing.location,
      website: parsed.data.website ?? existing.website,
      bio: parsed.data.bio ?? existing.bio,
      preferences,
      profilePrivacy
    }
  });

  await appendAuditLog({
    actorId: userId,
    actorRole,
    action: "USER_PROFILE_UPDATED_API",
    resourceType: "User",
    resourceId: userId,
    oldValue: {
      name: existing.name,
      phone: existing.phone,
      jobTitle: existing.jobTitle,
      company: existing.company,
      location: existing.location,
      website: existing.website,
      bio: existing.bio,
      preferences: existing.preferences,
      profilePrivacy: existing.profilePrivacy
    },
    newValue: {
      name: updated.name,
      phone: updated.phone,
      jobTitle: updated.jobTitle,
      company: updated.company,
      location: updated.location,
      website: updated.website,
      bio: updated.bio,
      preferences: updated.preferences,
      profilePrivacy: updated.profilePrivacy
    }
  });

  return NextResponse.json({ ok: true });
}

