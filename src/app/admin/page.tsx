import Link from "next/link";
import { requireAdmin } from "@/lib/require-auth";

export default async function AdminDashboard() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/admin/users" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:bg-neutral-800">
          <h2 className="text-lg font-semibold text-white">User Management</h2>
          <p className="mt-1 text-sm text-neutral-400">Add, edit, delete users and roles.</p>
        </Link>
        <Link href="/admin/settings" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:bg-neutral-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <p className="mt-1 text-sm text-neutral-400">Currencies, Languages, Travel Styles, Interests, Destinations.</p>
        </Link>
        <Link href="/admin/trip-layout" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:bg-neutral-800">
          <h2 className="text-lg font-semibold text-white">Trip Layout</h2>
          <p className="mt-1 text-sm text-neutral-400">Control Trip Summary block visibility and ordering.</p>
        </Link>
        <Link href="/admin/audit-logs" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:bg-neutral-800">
          <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
          <p className="mt-1 text-sm text-neutral-400">View and export audit trail.</p>
        </Link>
        <Link href="/admin/ai" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:bg-neutral-800">
          <h2 className="text-lg font-semibold text-white">AI Analytics</h2>
          <p className="mt-1 text-sm text-neutral-400">Track usage, costs, and generated images.</p>
        </Link>
      </div>
    </div>
  );
}

