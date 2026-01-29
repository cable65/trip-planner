"use client";

import { Trash2 } from "lucide-react";
import { deleteTripShare } from "./actions";

export function DeleteTripShareButton({ shareId }: { shareId: string }) {
  return (
    <form action={deleteTripShare as unknown as (formData: FormData) => Promise<void>}>
      <input type="hidden" name="shareId" value={shareId} />
      <button
        type="submit"
        className="rounded p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-red-400"
        title="Remove Request"
        onClick={(e) => {
          if (!confirm("Are you sure you want to remove this request?")) {
            e.preventDefault();
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
