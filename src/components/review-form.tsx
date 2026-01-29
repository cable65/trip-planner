"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewFormProps {
  targetType: string;
  targetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ targetType, targetId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Simple URL input for now
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          rating,
          comment,
          media: imageUrl ? [imageUrl] : [], // Array of strings
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit review");
      }

      setComment("");
      setImageUrl("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-lg font-semibold text-white">Leave a Review</h3>
      
      {/* Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              size={24}
              className={`${
                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-600"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-neutral-400">{rating} Stars</span>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-neutral-300">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
          placeholder="Share your experience..."
        />
      </div>

      {/* Media URL */}
      <div>
        <label className="block text-sm font-medium text-neutral-300">Photo URL (Optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-500"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
