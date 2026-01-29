import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ChatInterface from "./chat-interface";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = (session.user as any).id;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    redirect("/messages");
  }

  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== userId
  )?.user;

  if (!otherParticipant) {
     // Handle edge case where other participant might be missing/deleted
     return <div>Other participant not found</div>
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/messages" className="text-sm text-neutral-400 hover:text-white">
          ← Back to Messages
        </Link>
      </div>
      <ChatInterface
        conversationId={id}
        initialMessages={conversation.messages}
        currentUser={{
          id: userId,
          name: session.user.name || "Me",
        }}
        otherUser={otherParticipant}
      />
    </div>
  );
}
