import { headers } from "next/headers";

export async function getRequestMetadata() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0]?.trim() ?? null : h.get("x-real-ip");
  const userAgent = h.get("user-agent");
  return { ipAddress, userAgent };
}

