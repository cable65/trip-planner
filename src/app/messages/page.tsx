import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
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
              vendorProfile: {
                select: {
                  logoUrl: true,
                },
              },
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

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>
      <div className="flex flex-col gap-2">
        {conversations.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            No messages yet.
          </div>
        ) : (
          conversations.map((conversation) => {
            const otherParticipant = conversation.participants.find(
              (p) => p.userId !== userId
            )?.user;
            const lastMessage = conversation.messages[0];

            return (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:bg-neutral-800"
              >
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-neutral-700 overflow-hidden flex items-center justify-center">
                    {otherParticipant?.vendorProfile?.logoUrl ? (
                        <img src={otherParticipant.vendorProfile.logoUrl} alt={otherParticipant.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-lg font-semibold text-neutral-300">
                            {otherParticipant?.name?.[0]?.toUpperCase() || "?"}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold truncate">
                      {otherParticipant?.name || "Unknown User"}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(lastMessage.createdAt, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-neutral-400">
                    {lastMessage ? lastMessage.content : "No messages yet"}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
