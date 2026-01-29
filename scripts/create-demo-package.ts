
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendorId = "cmkdrd08o0001utyk9h7g7off";
  
  // Create Package
  const pkg = await prisma.vendorPackage.create({
    data: {
      vendorId,
      name: "Kuala Lumpur City Escape",
      description: "Experience the vibrant culture and modern skyline of KL with this 3D2N package.",
      priceCents: 50000, // RM 500.00
      commissionRate: 10,
      isApproved: true,
      media: JSON.stringify(["https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80"]),
    }
  });

  // Create Components
  await prisma.packageComponent.createMany({
    data: [
      {
        packageId: pkg.id,
        type: "accommodation",
        title: "Hotel Istana",
        details: { stars: 5, nights: 2, note: "Deluxe Room" }
      },
      {
        packageId: pkg.id,
        type: "activity",
        title: "KL Night Tour",
        details: { duration: "3 hours", note: "Includes dinner at KL Tower" }
      }
    ]
  });

  console.log(`Created package: ${pkg.name} (${pkg.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
