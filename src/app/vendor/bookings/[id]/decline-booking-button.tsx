
"use client";

import { declineBooking } from "./actions";

export function DeclineBookingButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={declineBooking}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        className="w-full rounded border border-red-800 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/40"
        onClick={(e) => {
          if (!confirm("Are you sure you want to decline this booking? This action cannot be undone.")) {
            e.preventDefault();
          }
        }}
      >
        Decline Booking
      </button>
    </form>
  );
}
