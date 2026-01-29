
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

export async function startConversation(targetUserId: string, context?: string) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  // 0. Verify target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    // If target user doesn't exist (e.g. manual vendor name entry), we can't start a chat.
    // In a real app, we might redirect to a "Invite Vendor" page or show an error.
    return;
  }

  // 1. Check for existing conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });

  // 2. Create if not exists
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
    });
  }

  // 3. Send context message if provided
  if (context) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: context,
      },
    });
  }

  // 4. Redirect to the chat
  redirect(`/messages/${conversation.id}`);
}
