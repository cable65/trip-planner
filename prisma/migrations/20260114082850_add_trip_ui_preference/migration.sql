-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "pax" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "AiImageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiImageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryRevision" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,

    CONSTRAINT "ItineraryRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripUiPreference" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "visibility" JSONB NOT NULL DEFAULT '{}',
    "sequence" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripUiPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryRevision_tripId_version_key" ON "ItineraryRevision"("tripId", "version");

-- AddForeignKey
ALTER TABLE "AiImageLog" ADD CONSTRAINT "AiImageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryRevision" ADD CONSTRAINT "ItineraryRevision_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryRevision" ADD CONSTRAINT "ItineraryRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
