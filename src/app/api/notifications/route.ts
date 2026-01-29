import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id, read } = await req.json();

  if (id) {
    // Mark specific notification as read
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: read ?? true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
