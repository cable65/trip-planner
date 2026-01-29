"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    setIsOpen(false);

    // Navigate based on type
    if (notification.type === "new_message" && notification.data?.conversationId) {
      router.push(`/messages/${notification.data.conversationId}`);
    } else if (notification.type === "new_booking" || notification.type === "payment_proof") {
      // Vendor notifications
      if (notification.data?.bookingId) {
        router.push(`/vendor/bookings/${notification.data.bookingId}`);
      }
    } else if (notification.type === "payment_approved") {
      // Traveler notification
      if (notification.data?.tripId && notification.data?.bookingId) {
        router.push(`/trips/${notification.data.tripId}/bookings/${notification.data.bookingId}`);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border border-neutral-800 bg-neutral-900 shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
            <h3 className="font-semibold text-neutral-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead();
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`cursor-pointer border-b border-neutral-800 px-4 py-3 hover:bg-neutral-800 ${
                    !notification.read ? "bg-neutral-800/30" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-neutral-200">
                    {notification.title}
                  </p>
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
