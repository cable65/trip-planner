import { prisma, auditPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { updateUserLanguage, updateUserCurrency } from "./actions";
import { getDictionary } from "@/lib/i18n";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const [user, languages, currencies] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Language" WHERE active = true ORDER BY label ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT code, label FROM "Currency" WHERE active = true ORDER BY code ASC`
  ]);

  const currentLanguage = (user?.preferences as any)?.language || "en";
  const currentCurrency = (user?.preferences as any)?.currency || "";
  const dict = await getDictionary(currentLanguage);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-white">{dict.settings.title}</h1>

      {user && (
        <ProfileForm
          user={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            jobTitle: user.jobTitle,
            company: user.company,
            location: user.location,
            website: user.website,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            coverUrl: user.coverUrl,
            preferences: user.preferences as any,
            profilePrivacy: user.profilePrivacy as any
          }}
        />
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-white">{dict.settings.preferences}</h2>
        <form action={updateUserLanguage} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="language">
              {dict.settings.language}
            </label>
            <select
              id="language"
              name="language"
              defaultValue={currentLanguage}
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              {dict.settings.languageHelp}
            </p>
          </div>
          <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            {dict.settings.save}
          </button>
        </form>

        <form action={updateUserCurrency} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-300" htmlFor="currency">
              {dict.settings.currency}
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={currentCurrency}
              className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
            >
              <option value="">{dict.settings.selectCurrency}</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} {c.label ? `— ${c.label}` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              {dict.settings.currencyHelp}
            </p>
          </div>
          <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            {dict.settings.save}
          </button>
        </form>
      </div>
    </div>
  );
}
