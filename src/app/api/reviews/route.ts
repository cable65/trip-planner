import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { targetType, targetId, rating, comment, media } = await req.json();

  if (!targetType || !targetId || !rating || !comment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId,
      targetType, // "vendor", "user", "package"
      targetId,
      rating,
      comment,
      media: media || [],
    },
  });

  return NextResponse.json(review);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { targetType, targetId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          // avatar?
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}
