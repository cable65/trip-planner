import { requireUser } from "@/lib/require-auth";
import { PackageForm } from "./package-form";

export default async function NewVendorPackagePage() {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  if (role !== "vendor") return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <h1 className="text-2xl font-semibold text-white">Create Trip Package</h1>
      <p className="text-neutral-400">
        Design a new travel experience for your customers. Add details, media, and itinerary components below.
      </p>
      <PackageForm />
    </div>
  );
}
