
import { prisma } from "./prisma";

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw, as notifications are non-critical
  }
}
