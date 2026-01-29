import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/ai/client";
import { randomUUID } from "crypto";

const GENERATED_DIR = path.join(process.cwd(), "public", "images", "generated");
const PLACEHOLDER_IMAGE = "/images/placeholder-trip.svg"; // Fallback image

async function ensureDirectory() {
  try {
    await fs.access(GENERATED_DIR);
  } catch {
    await fs.mkdir(GENERATED_DIR, { recursive: true });
  }
}

export async function getOrGenerateTripImage(
  destination: string,
  tripId?: string,
  userId?: string,
  forceRegenerate = false
): Promise<string> {
  // 1. Check Cache (Database)
  // We search for an existing log for this destination to reuse the image
  // This is a simple "Credit Optimization" strategy: reuse images for same destination
  if (!forceRegenerate) {
    const cachedLog = await prisma.aiImageLog.findFirst({
      where: {
        prompt: { contains: destination, mode: "insensitive" },
        imageUrl: { not: "" }
      },
      orderBy: { createdAt: "desc" }
    });

    if (cachedLog) {
      // Record a "cache hit" usage (0 cost)
      await prisma.aiImageLog.create({
        data: {
          userId,
          prompt: destination,
          imageUrl: cachedLog.imageUrl,
          costCents: 0,
          cached: true
        }
      });
      return cachedLog.imageUrl;
    }
  }

  // 2. Generate New Image
  try {
    const prompt = `A beautiful, photorealistic travel header image for ${destination}. High quality, scenic view, daytime, sunny.`;
    const imageBuffer = await generateImage(prompt);

    // 3. Save to Disk
    await ensureDirectory();
    const filename = `${randomUUID()}.jpg`;
    const filepath = path.join(GENERATED_DIR, filename);
    await fs.writeFile(filepath, imageBuffer);

    const publicUrl = `/images/generated/${filename}`;

    // 4. Log Usage (Cost ~ $0.04 for DALL-E 3 Standard)
    await prisma.aiImageLog.create({
      data: {
        userId,
        prompt: destination,
        imageUrl: publicUrl,
        costCents: 4, // Estimate
        cached: false
      }
    });

    // 5. Update Destination Table (Auto-fill missing images for future trips)
    // We try to find a destination with this name and update it if it has no image
    try {
      const dest = await prisma.destination.findFirst({
        where: { name: { equals: destination, mode: "insensitive" } }
      });
      if (dest && !dest.imageUrl) {
        await prisma.destination.update({
          where: { id: dest.id },
          data: { imageUrl: publicUrl }
        });
      }
    } catch (e) {
      console.warn("Failed to auto-update destination image:", e);
    }

    return publicUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
    // Return placeholder on failure
    return PLACEHOLDER_IMAGE;
  }
}
