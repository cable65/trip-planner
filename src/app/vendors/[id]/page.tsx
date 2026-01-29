import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CopyLinkButton } from "./copy-link-button";
import TrackView from "./track-view";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { vendorProfile: true } });
  if (!user || user.role !== "vendor") return { title: "Vendor Not Found" };
  const title = `${user.name || "Vendor"} – Profile`;
  const description = user.vendorProfile?.intro || "View vendor profile, services, and reviews.";
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}

export default async function PublicVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { vendorProfile: true }
  });

  if (!user || user.role !== "vendor") notFound();

  const profile = user.vendorProfile;

  const services = await prisma.booking.groupBy({
    by: ["type"],
    where: { vendorId: id, status: "confirmed" },
    _count: { _all: true }
  });

  const reviews = await prisma.review.findMany({
    where: { targetType: "Vendor", targetId: id },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const packages = await (prisma as any).vendorPackage.findMany({
    where: { vendorId: id, isApproved: true },
    include: {
        components: true,
        availability: true
    }
  });

  const avgRating = reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : null;

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3060"}/vendors/${id}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <TrackView vendorId={id} />
      {profile?.bannerUrl && (
        <div className="overflow-hidden rounded-xl">
          <img src={profile.bannerUrl} alt="Banner" className="h-48 w-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-800">
          {profile?.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-500">
              {user.name?.charAt(0) || "V"}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" aria-label="Vendor name">{user.name || "Vendor"}</h1>
          <p className="text-sm text-neutral-400" aria-label="Vendor tagline">Trusted travel vendor</p>
          <p className="text-sm text-neutral-300" aria-label="Contact email">{user.email}</p>
          {avgRating !== null && (
            <p className="text-sm text-neutral-300" aria-label="Average rating">Average rating: {avgRating}/5 ({reviews.length} reviews)</p>
          )}
        </div>
      </div>

      {profile?.intro && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-2 text-lg font-semibold text-white">About</h2>
          <div className="prose prose-invert max-w-none">{profile.intro}</div>
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Available Packages</h2>
        {packages.length === 0 ? (
          <p className="text-sm text-neutral-400">No packages available.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {packages.map((pkg: any) => (
              <div key={pkg.id} className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 p-4 transition hover:border-neutral-700">
                <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                <p className="mb-4 text-sm text-neutral-400 line-clamp-2">{pkg.description}</p>
                <div className="mt-auto flex items-center justify-between">
                   <div className="text-lg font-bold text-emerald-400">
                     ${pkg.priceCents / 100}
                   </div>
                   <Link 
                     href={`/packages/${pkg.id}`}
                     className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                   >
                     View Details
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Service Offerings</h2>
        {services.length === 0 ? (
          <p className="text-sm text-neutral-400">No confirmed services yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2" aria-label="Services list">
            {services.map((s) => (
              <li key={s.type} className="rounded border border-neutral-800 bg-neutral-950 p-3">
                <span className="font-medium text-white">{s.type}</span>
                <span className="ml-2 text-xs text-neutral-400">{s._count._all} bookings</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-white">Customer Reviews</h2>
        </div>
        {reviews.length === 0 ? (
          <div className="p-6 text-sm text-neutral-400">No reviews yet.</div>
        ) : (
          <div className="divide-y divide-neutral-800" aria-label="Reviews list">
            {reviews.map((r) => (
              <div key={r.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">Rating: {r.rating}/5</div>
                  <div className="text-xs text-neutral-500">{r.createdAt.toISOString().slice(0,10)}</div>
                </div>
                <p className="mt-2 text-sm text-neutral-300">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out this travel vendor!")}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          aria-label="Share on X"
        >
          Share on X
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          aria-label="Share on Facebook"
        >
          Share on Facebook
        </a>
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          aria-label="Share on LinkedIn"
        >
          Share on LinkedIn
        </a>
        <CopyLinkButton url={shareUrl} />
      </div>

      <div className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-white">Back to Home</Link>
      </div>
    </div>
  );
}

