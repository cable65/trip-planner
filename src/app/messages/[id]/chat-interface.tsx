"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Send, Image as ImageIcon, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
}

interface ChatInterfaceProps {
  conversationId: string;
  initialMessages: Message[];
  currentUser: User;
  otherUser: User;
}

export default function ChatInterface({
  conversationId,
  initialMessages,
  currentUser,
  otherUser,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const templates = [
    "Hi, thanks for your booking!",
    "Could you please provide more details?",
    "Payment received, thanks!",
    "Looking forward to hosting you!",
    "Just checking in, is everything okay?"
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages (simple implementation)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          // Ideally we merge, but replacing is simpler for now
          // We check if the length is different to avoid unnecessary re-renders or logic
          if (data.length !== messages.length) {
             setMessages(data);
          } else {
             // Check if the last message is different (in case of edits/deletes if we supported that, or just to be safe)
             const lastMsg = data[data.length - 1];
             const currentLastMsg = messages[messages.length - 1];
             if (lastMsg?.id !== currentLastMsg?.id) {
                 setMessages(data);
             }
          }
        }
      } catch (error) {
        console.error("Failed to poll messages", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [conversationId, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, { ...message, sender: currentUser }]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] border border-neutral-800 rounded-lg bg-neutral-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-800/50">
        <h2 className="font-semibold">{otherUser.name || "Unknown User"}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMe = message.senderId === currentUser.id;
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isMe
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-neutral-200"
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-neutral-500"}`}>
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="relative p-4 border-t border-neutral-800 bg-neutral-900 flex gap-2">
        {showTemplates && (
          <div className="absolute bottom-full left-4 mb-2 w-64 rounded-lg border border-neutral-800 bg-neutral-900 p-2 shadow-xl">
            <p className="mb-2 px-2 text-xs font-medium text-neutral-500">Quick Replies</p>
            {templates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => {
                  setNewMessage(template);
                  setShowTemplates(false);
                }}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                {template}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className={`p-2 hover:text-neutral-200 ${showTemplates ? "text-blue-400" : "text-neutral-400"}`}
          title="Quick templates"
        >
          <MessageSquare size={20} />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-400 hover:text-neutral-200"
          title="Upload image"
        >
          <ImageIcon size={20} />
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-neutral-800 border-none rounded-md px-4 py-2 text-neutral-200 focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
