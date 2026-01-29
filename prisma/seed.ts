import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('abcd1234', 10)

  // 1. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trip-planner.com' },
    update: {
      passwordHash,
      role: 'admin' as UserRole
    },
    create: {
      email: 'admin@trip-planner.com',
      name: 'System Admin',
      passwordHash,
      role: 'admin' as UserRole
    }
  })
  console.log('Seeded Admin:', admin.email)

  // 2. Vendor Account
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@trip-planner.com' },
    update: {
      passwordHash,
      role: 'vendor' as UserRole
    },
    create: {
      email: 'vendor@trip-planner.com',
      name: 'Demo Vendor',
      passwordHash,
      role: 'vendor' as UserRole
    }
  })
  
  // Ensure vendor profile exists
  await prisma.vendorProfile.upsert({
    where: { userId: vendor.id },
    update: {},
    create: {
      userId: vendor.id,
      intro: 'Best trips in town!',
      isApproved: true
    }
  })
  console.log('Seeded Vendor:', vendor.email)

  // 3. Traveler Account
  const traveler = await prisma.user.upsert({
    where: { email: 'traveler@trip-planner.com' },
    update: {
      passwordHash,
      role: 'traveler' as UserRole
    },
    create: {
      email: 'traveler@trip-planner.com',
      name: 'Demo Traveler',
      passwordHash,
      role: 'traveler' as UserRole
    }
  })
  console.log('Seeded Traveler:', traveler.email)

  const destinations = [
    { name: 'Kuala Lumpur', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Penang', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Langkawi', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Malacca', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1629814122588-3015f606337b?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Sabah', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1541363675704-5e36923485f7?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Sarawak', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1598502575276-857e2f5b35c0?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Cameron Highlands', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1647833074668-5226760655d6?q=80&w=2000&auto=format&fit=crop' },
    { name: 'George Town', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1535201258226-11475739d0c6?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Ipoh', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1608955243868-231a49479268?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Johor Bahru', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1604938637762-b753c5240217?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Putrajaya', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1605786884610-d8869c470196?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Kota Kinabalu', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1563868668407-28d886c31949?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Kuching', country: 'Malaysia', imageUrl: 'https://images.unsplash.com/photo-1598502575276-857e2f5b35c0?q=80&w=2000&auto=format&fit=crop' },
  ]

  console.log('Seeding destinations...')
  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { name: dest.name },
      update: { imageUrl: dest.imageUrl },
      create: { name: dest.name, country: dest.country, imageUrl: dest.imageUrl }
    })
  }

  // Also seed some interests and travel styles
  console.log('Seeding interests...')
  const interests = ['Food', 'Nature', 'History', 'Shopping', 'Adventure', 'Relaxation', 'Culture']
  for (const interest of interests) {
    await prisma.interestTag.upsert({
      where: { name: interest },
      update: {},
      create: { name: interest }
    })
  }

  console.log('Seeding travel styles...')
  const styles = ['Budget', 'Luxury', 'Family', 'Solo', 'Couple', 'Backpacker']
  for (const style of styles) {
    await prisma.travelStyle.upsert({
      where: { name: style },
      update: {},
      create: { name: style }
    })
  }
  console.log('Seeding completed.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
