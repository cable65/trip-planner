"use client";

import { updateBookingStatus } from "./actions";

export function StatusSelect({ bookingId, defaultStatus }: { bookingId: string; defaultStatus: string }) {
  return (
    <form action={updateBookingStatus} className="flex gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <select
        name="status"
        defaultValue={defaultStatus}
        className="rounded bg-neutral-900 px-2 py-1 text-xs text-neutral-300 ring-1 ring-neutral-800"
        onChange={(e) => e.target.form?.requestSubmit()}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>
    </form>
  );
}

