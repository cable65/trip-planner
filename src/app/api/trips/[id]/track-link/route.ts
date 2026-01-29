import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BodySchema = z.object({
    label: z.string().max(80),
    url: z.string().url().max(2000)
  });

  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { label, url } = parsed.data;

  await appendAuditLog({
    actorId: null,
    actorRole: null,
    action: "ITINERARY_LINK_CLICKED",
    resourceType: "Trip",
    resourceId: id,
    metadata: { label, url, source: "itinerary", route: "trips.track-link" }
  });

  return NextResponse.json({ ok: true });
}

