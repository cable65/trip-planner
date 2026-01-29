import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserCurrencyAndLocale, formatCurrency } from "@/lib/currency";
import { BookButton } from "./book-button";
import { PackageTracker } from "./package-tracker";

function formatComponentDetails(type: string, details: any) {
  if (!details || Object.keys(details).length === 0) return null;
  
  const parts = [];
  
  if (type === "accommodation") {
    if (details.stars) parts.push(`${details.stars} Stars`);
    if (details.nights) parts.push(`${details.nights} Nights`);
  } else if (type === "activity") {
    if (details.duration) parts.push(`Duration: ${details.duration}`);
  }
  
  if (details.note) parts.push(details.note);
  
  return parts.length > 0 ? parts.join(" • ") : null;
}

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const user = session?.user;

  const pkg = await (prisma as any).vendorPackage.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          name: true,
          email: true,
          vendorProfile: true
        }
      },
      components: true,
      availability: true
    }
  });

  if (!pkg) notFound();

  let trips: any[] = [];
  let currency = "USD";
  let locale = "en-US";
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id }, select: { preferences: true } });
    const result = getUserCurrencyAndLocale(dbUser?.preferences as any);
    currency = result.currency;
    locale = result.locale;

    trips = await prisma.trip.findMany({
      where: { userId: (user as any).id, status: { not: "cancelled" } },
      select: { id: true, destination: true, startDate: true, endDate: true },
      orderBy: { startDate: "asc" }
    });
  }

  const media = typeof pkg.media === "string" ? JSON.parse(pkg.media) : pkg.media;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <PackageTracker packageId={pkg.id} />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{pkg.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
            <span>By {pkg.vendor.name || "Unknown Vendor"}</span>
            {pkg.vendor.vendorProfile?.location && (
              <>
                <span>•</span>
                <span>{pkg.vendor.vendorProfile.location}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">
            {formatCurrency({ amount: pkg.priceCents / 100, currency, locale })}
          </div>
          <div className="text-xs text-neutral-500">per person</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">About this Package</h2>
            <p className="whitespace-pre-wrap text-neutral-300">{pkg.description}</p>
          </div>

          {/* Components */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">What&apos;s Included</h2>
            {pkg.components.length === 0 ? (
              <p className="text-neutral-500">No components listed.</p>
            ) : (
              <div className="space-y-4">
                {pkg.components.map((comp: any) => (
                  <div key={comp.id} className="flex gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                      {/* Icon placeholder based on type */}
                      {comp.type === "accommodation" ? "🏨" : comp.type === "activity" ? "🎟️" : "🚌"}
                    </div>
                    <div>
                      <div className="font-medium text-white">{comp.title}</div>
                      <div className="text-sm text-neutral-400">
                        {comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}
                      </div>
                      {comp.details && (
                        <div className="mt-1 text-xs text-neutral-500">
                          {formatComponentDetails(comp.type, comp.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Action */}
        <div className="space-y-6">
          <div className="sticky top-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-4 font-semibold text-white">Ready to book?</h3>
            <BookButton
              packageId={pkg.id}
              trips={trips}
              isAuthenticated={!!user}
            />
            <p className="mt-4 text-xs text-center text-neutral-500">
              Instant confirmation • Secure payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
