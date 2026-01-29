"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookPackage } from "../actions";

interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
}

interface BookButtonProps {
  packageId: string;
  trips: Trip[];
  isAuthenticated: boolean;
}

export function BookButton({ packageId, trips, isAuthenticated }: BookButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [availability, setAvailability] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Fetch availability when modal opens
  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const res = await fetch(`/api/packages/${packageId}/availability`);
      if (res.ok) {
        setAvailability(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.href));
      return;
    }
    setOpen(true);
    fetchAvailability();
  };

  // Check if a date is available
  const isDateAvailable = (dateString: string) => {
    const date = new Date(dateString);
    return availability.some(a => 
      date >= new Date(a.dateFrom) && 
      date <= new Date(a.dateTo) && 
      a.quantity > 0
    );
  };

  return (
    <>
      <button
        onClick={handleBook}
        className="w-full rounded bg-indigo-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-500"
      >
        Book This Package
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">Select a Trip & Date</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Choose which trip you want to add this package to.
            </p>

            {trips.length === 0 ? (
              <div className="mt-4 text-center">
                <p className="text-sm text-neutral-500">You don&apos;t have any upcoming trips.</p>
                <button
                  onClick={() => router.push("/trips/new")}
                  className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  Create a new trip first
                </button>
              </div>
            ) : (
              <form action={bookPackage} className="mt-4 space-y-4">
                <input type="hidden" name="packageId" value={packageId} />
                
                {/* Trip Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-300">Select Trip</label>
                  {trips.map((trip) => (
                    <label
                      key={trip.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                        selectedTrip === trip.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-neutral-800 hover:bg-neutral-800"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{trip.destination}</div>
                        <div className="text-xs text-neutral-400">
                          {new Date(trip.startDate).toLocaleDateString()} -{" "}
                          {new Date(trip.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="tripId"
                        value={trip.id}
                        checked={selectedTrip === trip.id}
                        onChange={(e) => setSelectedTrip(e.target.value)}
                        className="h-4 w-4 border-neutral-600 bg-neutral-900 text-indigo-600 focus:ring-indigo-600"
                        required
                      />
                    </label>
                  ))}
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                   <label className="block text-sm font-medium text-neutral-300">Select Date</label>
                   {loadingAvailability ? (
                     <div className="text-sm text-neutral-500">Loading availability...</div>
                   ) : (
                     <input 
                       type="date" 
                       name="date"
                       className="w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                       value={selectedDate}
                       onChange={(e) => setSelectedDate(e.target.value)}
                       min={new Date().toISOString().split('T')[0]}
                       required
                     />
                   )}
                   {selectedDate && !isDateAvailable(selectedDate) && (
                     <p className="text-xs text-red-400">Date not available</p>
                   )}
                   {selectedDate && isDateAvailable(selectedDate) && (
                     <p className="text-xs text-emerald-400">Available!</p>
                   )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedTrip || !selectedDate || !isDateAvailable(selectedDate)}
                    className="flex-1 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-500"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
