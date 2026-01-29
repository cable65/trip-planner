-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled');

-- AlterEnum
ALTER TYPE "ShareStatus" ADD VALUE 'RESPONDED';

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "ProfileMetric" (
    "vendorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "CampaignMetric" (
    "campaignId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VendorPackage" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "commissionRate" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "media" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageComponent" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PackageComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageAvailability" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackageAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "target" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignVariation" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariationMetric" (
    "variationId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileMetric_vendorId_key" ON "ProfileMetric"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMetric_campaignId_key" ON "CampaignMetric"("campaignId");

-- CreateIndex
CREATE INDEX "VendorPackage_vendorId_idx" ON "VendorPackage"("vendorId");

-- CreateIndex
CREATE INDEX "PackageComponent_packageId_idx" ON "PackageComponent"("packageId");

-- CreateIndex
CREATE INDEX "PackageAvailability_packageId_idx" ON "PackageAvailability"("packageId");

-- CreateIndex
CREATE INDEX "Campaign_vendorId_idx" ON "Campaign"("vendorId");

-- CreateIndex
CREATE INDEX "CampaignVariation_campaignId_idx" ON "CampaignVariation"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "VariationMetric_variationId_key" ON "VariationMetric"("variationId");

-- AddForeignKey
ALTER TABLE "ProfileMetric" ADD CONSTRAINT "ProfileMetric_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMetric" ADD CONSTRAINT "CampaignMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPackage" ADD CONSTRAINT "VendorPackage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageComponent" ADD CONSTRAINT "PackageComponent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "VendorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageAvailability" ADD CONSTRAINT "PackageAvailability_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "VendorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignVariation" ADD CONSTRAINT "CampaignVariation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariationMetric" ADD CONSTRAINT "VariationMetric_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "CampaignVariation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
