-- CreateTable
CREATE TABLE "PackageMetric" (
    "packageId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "bookings" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageMetric_packageId_key" ON "PackageMetric"("packageId");

-- AddForeignKey
ALTER TABLE "PackageMetric" ADD CONSTRAINT "PackageMetric_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "VendorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
