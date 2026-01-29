"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";

const CreateUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(1),
  role: z.enum(["traveler", "vendor", "admin"]),
  password: z.string().min(8)
});

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().toLowerCase(),
  name: z.string().min(1),
  role: z.enum(["traveler", "vendor", "admin"])
});

const DeleteUserSchema = z.object({ id: z.string().min(1) });

export async function createUser(formData: FormData) {
  await requireAdmin();
  const { ipAddress, userAgent } = await getRequestMetadata();
  const parsed = CreateUserSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "traveler"),
    password: String(formData.get("password") ?? "")
  });
  if (!parsed.success) return;

  const { email, name, role, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const adminSession = await requireAdmin();
  const actorId = (adminSession.user as any).id as string;
  const actorRole = (adminSession.user as any).role as string;

  const user = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.user.create({
        data: { email, name, role, passwordHash }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "ADMIN_USER_CREATED",
    resourceType: "User",
    resourceId: user.id,
    oldValue: null,
    newValue: { id: user.id, email, name, role }
  });

  revalidatePath("/admin/users");
}

export async function updateUser(formData: FormData) {
  await requireAdmin();
  const { ipAddress, userAgent } = await getRequestMetadata();
  const parsed = UpdateUserSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? "traveler")
  });
  if (!parsed.success) return;

  const adminSession = await requireAdmin();
  const actorId = (adminSession.user as any).id as string;
  const actorRole = (adminSession.user as any).role as string;

  const existing = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return;

  const updated = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.user.update({
        where: { id: parsed.data.id },
        data: { email: parsed.data.email, name: parsed.data.name, role: parsed.data.role }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "ADMIN_USER_UPDATED",
    resourceType: "User",
    resourceId: updated.id,
    oldValue: { email: existing.email, name: existing.name, role: existing.role },
    newValue: { email: updated.email, name: updated.name, role: updated.role }
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const { ipAddress, userAgent } = await getRequestMetadata();
  const parsed = DeleteUserSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;

  const adminSession = await requireAdmin();
  const actorId = (adminSession.user as any).id as string;
  const actorRole = (adminSession.user as any).role as string;

  const existing = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () => prisma.user.delete({ where: { id: parsed.data.id } })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "ADMIN_USER_DELETED",
    resourceType: "User",
    resourceId: parsed.data.id,
    oldValue: { email: existing.email, name: existing.name, role: existing.role },
    newValue: null
  });

  revalidatePath("/admin/users");
}

