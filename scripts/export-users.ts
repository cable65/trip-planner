import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Exporting users from development database...');
  
  const users = await prisma.user.findMany({
    include: {
      vendorProfile: true,
    }
  });

  const dumpPath = path.join(process.cwd(), 'prisma', 'users-dump.json');
  
  // Sanitize data if needed (though hashes are needed for migration)
  const data = users.map(user => ({
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    role: user.role,
    preferences: user.preferences,
    profilePrivacy: user.profilePrivacy,
    vendorProfile: user.vendorProfile ? {
      intro: user.vendorProfile.intro,
      logoUrl: user.vendorProfile.logoUrl,
      bannerUrl: user.vendorProfile.bannerUrl,
      location: user.vendorProfile.location,
      phone: user.vendorProfile.phone,
      website: user.vendorProfile.website,
      isApproved: user.vendorProfile.isApproved,
    } : null
  }));

  fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2));
  
  console.log(`Successfully exported ${users.length} users to ${dumpPath}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
