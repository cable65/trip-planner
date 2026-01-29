import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Format response to be cleaner for UI
  const formatted = conversations.map((conv) => {
    const otherParticipant = conv.participants.find((p) => p.userId !== userId);
    const lastMessage = conv.messages[0];
    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      otherParticipant: otherParticipant?.user,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          }
        : null,
      unreadCount: 0, // TODO: Implement unread count logic
    };
  });

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId } = await req.json();
  const userId = (session.user as any).id;

  if (!targetUserId) {
    return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
  }

  // Check if conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: userId },
          { userId: targetUserId },
        ],
      },
    },
  });

  return NextResponse.json({ id: conversation.id });
}
