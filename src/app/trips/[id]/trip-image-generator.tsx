"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, Image as ImageIcon } from "lucide-react";
import { generateTripImageAction } from "./actions";

export function TripImageGenerator({ 
  tripId, 
  hasImage 
}: { 
  tripId: string; 
  hasImage: boolean; 
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate if no image exists
  useEffect(() => {
    if (!hasImage && !isGenerating) {
      setIsGenerating(true);
      // We use a transition-like delay to not block immediate render
      // But server actions are async.
      generateTripImageAction(tripId)
        .catch((e) => console.error(e))
        .finally(() => setIsGenerating(false));
    }
  }, [hasImage, tripId]); // Run once if !hasImage

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      await generateTripImageAction(tripId, true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-md">
        <Loader2 className="h-3 w-3 animate-spin" />
        Generating AI Image...
      </div>
    );
  }

  return (
    <button
      onClick={handleRegenerate}
      className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/50"
      title="Regenerate Image with AI"
    >
      <Sparkles className="h-3 w-3" />
      <span>Regenerate Image</span>
    </button>
  );
}
