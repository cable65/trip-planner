import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if ((session.user as any).role !== "admin") redirect("/trips");
  return session;
}

