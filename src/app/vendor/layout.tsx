import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-auth";

export default async function VendorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const role = (session.user as any).role;

  if (role !== "vendor") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold">Vendor Portal</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/vendor/dashboard" className="hover:text-white text-neutral-400">Dashboard</Link>
            <Link href="/vendor/packages" className="hover:text-white text-neutral-400">Packages</Link>
            <Link href="/vendor/bookings" className="hover:text-white text-neutral-400">Bookings</Link>
            <Link href="/vendor/campaigns" className="hover:text-white text-neutral-400">Campaigns</Link>
            <Link href="/vendor/requests/bulk" className="hover:text-white text-neutral-400">Bulk Respond</Link>
            <Link href="/vendor/reviews" className="hover:text-white text-neutral-400">Reviews</Link>
            <Link href="/vendor/profile" className="hover:text-white text-neutral-400">Profile</Link>
            <Link href="/vendors/me" className="hover:text-white text-neutral-400">Public Profile</Link>
            <Link href="/" className="hover:text-white text-neutral-400">Back to Home</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
