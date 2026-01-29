import { requireAdmin } from "@/lib/require-auth";
import { TripLayoutSettings } from "./trip-layout-settings";

export default async function TripLayoutAdminPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Trip Layout Controls</h1>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <TripLayoutSettings />
      </div>
    </div>
  );
}

