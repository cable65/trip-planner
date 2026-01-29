import { auditPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getCurrentUserLocale, getDictionary } from "@/lib/i18n";
import { TripForm } from "./trip-form";

export default async function NewTripPage() {
  await requireUser();
  const locale = await getCurrentUserLocale();
  const dict = await getDictionary(locale);

  const [travelStyles, interests, destinations] = await Promise.all([
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "TravelStyle" WHERE active = true ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "InterestTag" WHERE active = true ORDER BY name ASC`,
    auditPrisma.$queryRaw<any[]>`SELECT id, name FROM "Destination" WHERE active = true ORDER BY name ASC`
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{dict.generateTrip.title}</h1>
      <TripForm
        destinations={destinations}
        travelStyles={travelStyles}
        interests={interests}
        dict={dict}
      />
    </div>
  );
}
