"use client";

import { useState } from "react";
import { ReviewForm } from "./review-form";
import { MessageSquare } from "lucide-react";

interface ReviewButtonProps {
  targetType: string;
  targetId: string;
  label?: string;
}

export function ReviewButton({ targetType, targetId, label = "Leave Review" }: ReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md">
          <ReviewForm
            targetType={targetType}
            targetId={targetId}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
    >
      <MessageSquare size={14} />
      {label}
    </button>
  );
}
