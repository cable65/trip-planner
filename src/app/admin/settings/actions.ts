"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditPrisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";

const NameSchema = z.object({ id: z.string().optional(), name: z.string().min(1) });
const CodeLabelSchema = z.object({ code: z.string().min(2), label: z.string().min(1) });
const CodeSchema = z.object({ code: z.string().min(2) });
const IdSchema = z.object({ id: z.string().min(1) });

async function withAudit<T>(actorId: string, actorRole: string, fn: () => Promise<T>) {
  const { ipAddress, userAgent } = await getRequestMetadata();
  return runWithAuditContext({ actorId, actorRole, ipAddress, userAgent }, fn);
}

export async function createCurrency(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeLabelSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? "")
  });
  if (!parsed.success) return;
  const { code, label } = parsed.data;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`INSERT INTO "Currency" (code, label, active, "createdAt", "updatedAt") VALUES (${code}, ${label}, true, NOW(), NOW())`;
    return { code, label } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_CURRENCY_CREATED", resourceType: "Currency", resourceId: row.code, oldValue: null, newValue: { code, label } });
  revalidatePath("/admin/settings");
}

export async function updateCurrency(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeLabelSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? "")
  });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Currency" WHERE code = ${parsed.data.code} LIMIT 1`)[0];
  if (!existing) return;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`UPDATE "Currency" SET label = ${parsed.data.label}, "updatedAt" = NOW() WHERE code = ${parsed.data.code}`;
    return { code: parsed.data.code, label: parsed.data.label } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_CURRENCY_UPDATED", resourceType: "Currency", resourceId: row.code, oldValue: { label: existing.label }, newValue: { label: row.label } });
  revalidatePath("/admin/settings");
}

export async function deleteCurrency(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeSchema.safeParse({ code: String(formData.get("code") ?? "") });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Currency" WHERE code = ${parsed.data.code} LIMIT 1`)[0];
  if (!existing) return;
  await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`DELETE FROM "Currency" WHERE code = ${parsed.data.code}`;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_CURRENCY_DELETED", resourceType: "Currency", resourceId: parsed.data.code, oldValue: { label: existing.label }, newValue: null });
  revalidatePath("/admin/settings");
}

export async function createLanguage(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeLabelSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? "")
  });
  if (!parsed.success) return;
  const { code, label } = parsed.data;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`INSERT INTO "Language" (code, label, active, "createdAt", "updatedAt") VALUES (${code}, ${label}, true, NOW(), NOW())`;
    return { code, label } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_LANGUAGE_CREATED", resourceType: "Language", resourceId: row.code, oldValue: null, newValue: { code, label } });
  revalidatePath("/admin/settings");
}

export async function updateLanguage(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeLabelSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? "")
  });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Language" WHERE code = ${parsed.data.code} LIMIT 1`)[0];
  if (!existing) return;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`UPDATE "Language" SET label = ${parsed.data.label}, "updatedAt" = NOW() WHERE code = ${parsed.data.code}`;
    return { code: parsed.data.code, label: parsed.data.label } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_LANGUAGE_UPDATED", resourceType: "Language", resourceId: row.code, oldValue: { label: existing.label }, newValue: { label: row.label } });
  revalidatePath("/admin/settings");
}

export async function deleteLanguage(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = CodeSchema.safeParse({ code: String(formData.get("code") ?? "") });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Language" WHERE code = ${parsed.data.code} LIMIT 1`)[0];
  if (!existing) return;
  await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`DELETE FROM "Language" WHERE code = ${parsed.data.code}`;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_LANGUAGE_DELETED", resourceType: "Language", resourceId: parsed.data.code, oldValue: { label: existing.label }, newValue: null });
  revalidatePath("/admin/settings");
}

export async function createTravelStyle(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return;
  const row = await withAudit(actorId, actorRole, async () => {
    const id = randomUUID();
    await auditPrisma.$executeRaw`INSERT INTO "TravelStyle" (id, name, active, "createdAt", "updatedAt") VALUES (${id}, ${parsed.data.name}, true, NOW(), NOW())`;
    return { id, name: parsed.data.name } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_TRAVEL_STYLE_CREATED", resourceType: "TravelStyle", resourceId: row.id, oldValue: null, newValue: { name: row.name } });
  revalidatePath("/admin/settings");
}

export async function updateTravelStyle(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ id: String(formData.get("id") ?? ""), name: String(formData.get("name") ?? "") });
  if (!parsed.success || !parsed.data.id) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "TravelStyle" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`UPDATE "TravelStyle" SET name = ${parsed.data.name}, "updatedAt" = NOW() WHERE id = ${parsed.data.id}`;
    return { id: parsed.data.id, name: parsed.data.name } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_TRAVEL_STYLE_UPDATED", resourceType: "TravelStyle", resourceId: row.id, oldValue: { name: existing.name }, newValue: { name: row.name } });
  revalidatePath("/admin/settings");
}

export async function deleteTravelStyle(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = IdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "TravelStyle" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`DELETE FROM "TravelStyle" WHERE id = ${parsed.data.id}`;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_TRAVEL_STYLE_DELETED", resourceType: "TravelStyle", resourceId: parsed.data.id, oldValue: { name: existing.name }, newValue: null });
  revalidatePath("/admin/settings");
}

export async function createInterest(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return;
  const row = await withAudit(actorId, actorRole, async () => {
    const id = randomUUID();
    await auditPrisma.$executeRaw`INSERT INTO "InterestTag" (id, name, active, "createdAt", "updatedAt") VALUES (${id}, ${parsed.data.name}, true, NOW(), NOW())`;
    return { id, name: parsed.data.name } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_INTEREST_CREATED", resourceType: "InterestTag", resourceId: row.id, oldValue: null, newValue: { name: row.name } });
  revalidatePath("/admin/settings");
}

export async function updateInterest(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ id: String(formData.get("id") ?? ""), name: String(formData.get("name") ?? "") });
  if (!parsed.success || !parsed.data.id) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "InterestTag" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`UPDATE "InterestTag" SET name = ${parsed.data.name} WHERE id = ${parsed.data.id}`;
    return { id: parsed.data.id, name: parsed.data.name } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_INTEREST_UPDATED", resourceType: "InterestTag", resourceId: row.id, oldValue: { name: existing.name }, newValue: { name: row.name } });
  revalidatePath("/admin/settings");
}

export async function deleteInterest(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = IdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "InterestTag" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`DELETE FROM "InterestTag" WHERE id = ${parsed.data.id}`;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_INTEREST_DELETED", resourceType: "InterestTag", resourceId: parsed.data.id, oldValue: { name: existing.name }, newValue: null });
  revalidatePath("/admin/settings");
}

export async function createDestination(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return;
  const name = parsed.data.name.trim();
  const row = await withAudit(actorId, actorRole, async () => {
    const id = randomUUID();
    await auditPrisma.$executeRaw`INSERT INTO "Destination" (id, name, country, active, "createdAt", "updatedAt") VALUES (${id}, ${name}, ${"Malaysia"}, true, NOW(), NOW())`;
    return { id, name, country: "Malaysia" } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_DESTINATION_CREATED", resourceType: "Destination", resourceId: row.id, oldValue: null, newValue: { name: row.name, country: row.country } });
  revalidatePath("/admin/settings");
}

export async function updateDestination(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = NameSchema.safeParse({ id: String(formData.get("id") ?? ""), name: String(formData.get("name") ?? "") });
  if (!parsed.success || !parsed.data.id) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "Destination" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  const name = parsed.data.name.trim();
  const row = await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`UPDATE "Destination" SET name = ${name} WHERE id = ${parsed.data.id}`;
    return { id: parsed.data.id, name } as any;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_DESTINATION_UPDATED", resourceType: "Destination", resourceId: row.id, oldValue: { name: existing.name }, newValue: { name: row.name } });
  revalidatePath("/admin/settings");
}

export async function deleteDestination(formData: FormData) {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const parsed = IdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;
  const existing = (await auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "Destination" WHERE id = ${parsed.data.id} LIMIT 1`)[0];
  if (!existing) return;
  await withAudit(actorId, actorRole, async () => {
    await auditPrisma.$executeRaw`DELETE FROM "Destination" WHERE id = ${parsed.data.id}`;
  });
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_DESTINATION_DELETED", resourceType: "Destination", resourceId: parsed.data.id, oldValue: { name: existing.name }, newValue: null });
  revalidatePath("/admin/settings");
}

export async function seedDefaults() {
  const session = await requireAdmin();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const run = async () => {
    const currencies = [
      ["MYR", "Malaysian Ringgit"],
      ["USD", "US Dollar"],
      ["SGD", "Singapore Dollar"],
      ["EUR", "Euro"],
      ["CNY", "Chinese Yuan"],
      ["JPY", "Japanese Yen"],
      ["KRW", "Korean Won"],
      ["THB", "Thai Baht"],
      ["IDR", "Indonesian Rupiah"]
    ];
    for (const [code, label] of currencies) {
      await auditPrisma.$executeRaw`INSERT INTO "Currency" (code, label, active, "createdAt", "updatedAt") VALUES (${code}, ${label}, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
    }
    const languages = [
      ["zh", "Chinese"],
      ["en", "English"],
      ["ms", "Malay"]
    ];
    for (const [code, label] of languages) {
      await auditPrisma.$executeRaw`INSERT INTO "Language" (code, label, active, "createdAt", "updatedAt") VALUES (${code}, ${label}, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`;
    }
    const travelStyles = ["Backpacking", "Luxury", "Family", "Adventure", "Relaxed"];
    for (const name of travelStyles) {
      await auditPrisma.$executeRaw`INSERT INTO "TravelStyle" (id, name, active, "createdAt", "updatedAt") VALUES (${randomUUID()}, ${name}, true, NOW(), NOW()) ON CONFLICT (name) DO NOTHING`;
    }
    const interests = ["Food", "Culture", "Nature", "Shopping", "History", "Beach"];
    for (const name of interests) {
      await auditPrisma.$executeRaw`INSERT INTO "InterestTag" (id, name, active, "createdAt", "updatedAt") VALUES (${randomUUID()}, ${name}, true, NOW(), NOW()) ON CONFLICT (name) DO NOTHING`;
    }
    const malaysiaCities = [
      "Kuala Lumpur",
      "George Town",
      "Johor Bahru",
      "Malacca",
      "Ipoh",
      "Kota Kinabalu",
      "Kuching",
      "Langkawi",
      "Cameron Highlands",
      "Putrajaya"
    ];
    for (const name of malaysiaCities) {
      await auditPrisma.$executeRaw`INSERT INTO "Destination" (id, name, country, active, "createdAt", "updatedAt") VALUES (${randomUUID()}, ${name}, ${"Malaysia"}, true, NOW(), NOW()) ON CONFLICT (name) DO NOTHING`;
    }
  };
  await withAudit(actorId, actorRole, run);
  await appendAuditLog({ actorId, actorRole, action: "SETTINGS_SEEDED_DEFAULTS", resourceType: "Settings", resourceId: null, oldValue: null, newValue: { seeded: true } });
  revalidatePath("/admin/settings");
}

