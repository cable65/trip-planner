import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;

  // Verify participant
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const { content, attachments } = await req.json();

  // Verify participant
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: userId,
      content,
      attachments: attachments || [],
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // Create notifications for other participants
  const otherParticipants = conversation.participants.filter((p) => p.userId !== userId);
  for (const participant of otherParticipants) {
    await prisma.notification.create({
      data: {
        userId: participant.userId,
        type: "new_message",
        title: "New Message",
        message: `You have a new message from ${session.user.name || "someone"}`,
        data: { conversationId: id, messageId: message.id },
      },
    });
  }

  return NextResponse.json(message);
}
