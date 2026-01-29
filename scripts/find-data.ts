
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "vendor" } },
        { email: { contains: "traveler" } }
      ]
    },
    select: { id: true, name: true, email: true, role: true }
  });
  console.log("Users:", JSON.stringify(users, null, 2));

  const trips = await prisma.trip.findMany({
    select: { id: true, destination: true, userId: true, user: { select: { email: true } } }
  });
  console.log("Trips:", JSON.stringify(trips, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
