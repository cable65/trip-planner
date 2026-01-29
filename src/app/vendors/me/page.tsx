import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-auth";

export default async function MyPublicVendorRedirect() {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  if (role !== "vendor") redirect("/");
  const userId = (session.user as any).id as string;
  redirect(`/vendors/${userId}`);
}

