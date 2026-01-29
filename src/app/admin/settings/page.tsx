import { auditPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import {
  createCurrency,
  updateCurrency,
  deleteCurrency,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  createTravelStyle,
  updateTravelStyle,
  deleteTravelStyle,
  createInterest,
  updateInterest,
  deleteInterest,
  createDestination,
  updateDestination,
  deleteDestination,
  seedDefaults
} from "./actions";

export default async function SettingsAdminPage() {
  await requireAdmin();
  const [currencies, languages, travelStyles, interests, destinations] = await Promise.all([
    auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Currency" ORDER BY code ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Language" ORDER BY code ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "TravelStyle" ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "InterestTag" ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name, country FROM "Destination" ORDER BY name ASC`
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <form action={seedDefaults}>
          <button className="rounded bg-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-700">Seed defaults</button>
        </form>
      </div>

      <Section title="Currencies">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {currencies.map((c) => (
            <div key={c.code} className="rounded border border-neutral-800 p-3">
              <form action={updateCurrency} className="flex items-center gap-2">
                <input name="code" defaultValue={c.code} readOnly className="w-24 cursor-not-allowed rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <input name="label" defaultValue={c.label ?? ""} className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white">Save</button>
              </form>
              <form action={deleteCurrency} className="mt-2">
                <input type="hidden" name="code" value={c.code} />
                <button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createCurrency} className="mt-3 flex items-center gap-2">
          <input name="code" placeholder="Code" className="w-24 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <input name="label" placeholder="Label" className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white">Add</button>
        </form>
      </Section>

      <Section title="Languages">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {languages.map((l) => (
            <div key={l.code} className="rounded border border-neutral-800 p-3">
              <form action={updateLanguage} className="flex items-center gap-2">
                <input name="code" defaultValue={l.code} readOnly className="w-24 cursor-not-allowed rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <input name="label" defaultValue={l.label ?? ""} className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white">Save</button>
              </form>
              <form action={deleteLanguage} className="mt-2">
                <input type="hidden" name="code" value={l.code} />
                <button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createLanguage} className="mt-3 flex items-center gap-2">
          <input name="code" placeholder="Code" className="w-24 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <input name="label" placeholder="Label" className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white">Add</button>
        </form>
      </Section>

      <Section title="Travel Styles">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {travelStyles.map((t) => (
            <div key={t.id} className="rounded border border-neutral-800 p-3">
              <form action={updateTravelStyle} className="flex items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input name="name" defaultValue={t.name} className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white">Save</button>
              </form>
              <form action={deleteTravelStyle} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createTravelStyle} className="mt-3 flex items-center gap-2">
          <input name="name" placeholder="Name" className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white">Add</button>
        </form>
      </Section>

      <Section title="Interests">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {interests.map((i) => (
            <div key={i.id} className="rounded border border-neutral-800 p-3">
              <form action={updateInterest} className="flex items-center gap-2">
                <input type="hidden" name="id" value={i.id} />
                <input name="name" defaultValue={i.name} className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white">Save</button>
              </form>
              <form action={deleteInterest} className="mt-2">
                <input type="hidden" name="id" value={i.id} />
                <button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createInterest} className="mt-3 flex items-center gap-2">
          <input name="name" placeholder="Name" className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white">Add</button>
        </form>
      </Section>

      <Section title="Destinations (Malaysia only)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {destinations.map((d) => (
            <div key={d.id} className="rounded border border-neutral-800 p-3">
              <form action={updateDestination} className="flex items-center gap-2">
                <input type="hidden" name="id" value={d.id} />
                <input name="name" defaultValue={d.name} className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" />
                <span className="text-xs text-neutral-500">{d.country}</span>
                <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white">Save</button>
              </form>
              <form action={deleteDestination} className="mt-2">
                <input type="hidden" name="id" value={d.id} />
                <button className="rounded bg-red-600 px-2 py-1 text-xs text-white">Delete</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createDestination} className="mt-3 flex items-center gap-2">
          <input name="name" placeholder="City or Place" className="flex-1 rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800" required />
          <button className="rounded bg-indigo-600 px-3 py-1 text-xs text-white">Add</button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

