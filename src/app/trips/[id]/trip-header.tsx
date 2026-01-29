import Link from "next/link";
import { MapPin, Calendar, Wallet, Hash, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { TripImageGenerator } from "./trip-image-generator";

type TripHeaderProps = {
  tripId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  pax?: number;
  travelStyle?: string | null;
  interests: string[];
  currency?: string;
  locale?: string;
  imageUrl?: string | null;
};

export function TripHeader({
  tripId,
  destination,
  startDate,
  endDate,
  budget,
  pax = 1,
  travelStyle,
  interests,
  currency,
  locale,
  imageUrl
}: TripHeaderProps) {
  const safeCurrency = currency || "USD";
  const safeLocale = locale || "en-US";

  const totalBudgetDisplay = typeof budget === "number" ? new Intl.NumberFormat(safeLocale, { style: "currency", currency: safeCurrency, currencyDisplay: "symbol" }).format(budget) : "";
  const perPersonBudgetDisplay = typeof budget === "number" && pax > 0 ? new Intl.NumberFormat(safeLocale, { style: "currency", currency: safeCurrency, currencyDisplay: "symbol" }).format(budget / pax) : "";

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-sm">
      {imageUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={imageUrl}
            alt={destination}
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
        </div>
      )}
      <div className="relative z-10 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <MapPin className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Destination</span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">{destination}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/trips/${tripId}/edit`}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Edit2 className="h-4 w-4" />
            Edit Trip
          </Link>
          <TripImageGenerator tripId={tripId} hasImage={!!imageUrl} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-neutral-800 pt-6 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-400">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Dates</span>
          </div>
          <div className="font-semibold text-neutral-100">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-400">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Budget ({pax} Pax)</span>
          </div>
          <div className="font-semibold text-neutral-100">
            {budget ? (
              <div className="flex flex-col">
                <span>{totalBudgetDisplay}</span>
                <span className="text-xs text-neutral-400 font-normal">
                  {perPersonBudgetDisplay ? `~${perPersonBudgetDisplay} / pp` : ""}
                </span>
              </div>
            ) : "Not set"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-400">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Style</span>
          </div>
          <div className="font-semibold text-neutral-100 capitalize">
            {travelStyle || "Flexible"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-neutral-400">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">Interests</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {interests.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
              >
                {tag}
              </span>
            ))}
            {interests.length > 3 && (
              <span className="inline-flex items-center rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                +{interests.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
