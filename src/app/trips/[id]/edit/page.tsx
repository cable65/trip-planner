import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, auditPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { updateTrip } from "../actions";

export default async function EditTripPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const trip = await prisma.trip.findFirst({
    where: { id, userId }
  });
  if (!trip) notFound();

  const [travelStyles, interests, destinations] = await Promise.all([
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "TravelStyle" ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "InterestTag" ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "Destination" ORDER BY name ASC`
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Edit Trip</h1>
        <Link
          href={`/trips/${trip.id}`}
          className="rounded bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
        >
          Cancel
        </Link>
      </div>

      <form action={updateTrip} className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <input type="hidden" name="tripId" value={trip.id} />

        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="destination">Destination (Malaysia)</label>
          <select id="destination" name="destination" defaultValue={trip.destination} required className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800">
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="startDate">
              Start date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={trip.startDate.toISOString().slice(0, 10)}
              required
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="endDate">
              End date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={trip.endDate.toISOString().slice(0, 10)}
              required
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="budget">
              Budget
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              min={1}
              defaultValue={trip.budget ?? undefined}
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="pax">
              Travelers
            </label>
            <input
              id="pax"
              name="pax"
              type="number"
              min={1}
              max={99}
              defaultValue={trip.pax}
              required
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="travelStyle">Travel style</label>
            <select id="travelStyle" name="travelStyle" defaultValue={trip.travelStyle ?? ""} className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800">
              <option value="">Select style</option>
              {travelStyles.map((ts) => (
                <option key={ts.id} value={ts.name}>{ts.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="interests">Interests</label>
          <select id="interests" name="interests" multiple defaultValue={trip.interests} className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800 h-28">
            {interests.map((i) => (
              <option key={i.id} value={i.name}>{i.name}</option>
            ))}
          </select>
        </div>

        <button className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Save changes
        </button>
      </form>
    </div>
  );
}

