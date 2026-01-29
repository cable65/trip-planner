"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTripFromAi } from "../actions";

interface TripFormProps {
  destinations: { id: string; name: string }[];
  travelStyles: { id: string; name: string }[];
  interests: { id: string; name: string }[];
  dict: any;
}

const initialState = {
  message: "",
  errors: {} as Record<string, string[]>
};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {text}
    </button>
  );
}

export function TripForm({ destinations, travelStyles, interests, dict }: TripFormProps) {
  const [state, formAction] = useActionState(createTripFromAi, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded border border-neutral-800 p-5">
      {state.message && (
        <div className="rounded bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="destination">
            {dict.generateTrip.destination}
          </label>
          <select
            id="destination"
            name="destination"
            required
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          >
            <option value="">{dict.generateTrip.selectDestination}</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          {state.errors?.destination && (
            <p className="text-xs text-red-400">{state.errors.destination.join(", ")}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="travelStyle">
            {dict.generateTrip.travelStyle}
          </label>
          <select
            id="travelStyle"
            name="travelStyle"
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          >
            <option value="">{dict.generateTrip.selectStyle}</option>
            {travelStyles.map((ts) => (
              <option key={ts.id} value={ts.name}>
                {ts.name}
              </option>
            ))}
          </select>
          {state.errors?.travelStyle && (
            <p className="text-xs text-red-400">{state.errors.travelStyle.join(", ")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="startDate">
            {dict.generateTrip.startDate}
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          />
          {state.errors?.startDate && (
            <p className="text-xs text-red-400">{state.errors.startDate.join(", ")}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="endDate">
            {dict.generateTrip.endDate}
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          />
          {state.errors?.endDate && (
            <p className="text-xs text-red-400">{state.errors.endDate.join(", ")}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="pax">
            {dict.generateTrip.pax || "Travelers"}
          </label>
          <input
            id="pax"
            name="pax"
            type="number"
            min={1}
            max={99}
            defaultValue={1}
            required
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="budget">
            {dict.generateTrip.budget}
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min={1}
            placeholder="1500"
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
          />
          {state.errors?.budget && (
            <p className="text-xs text-red-400">{state.errors.budget.join(", ")}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="interests">
          {dict.generateTrip.interests}
        </label>
        <select
          id="interests"
          name="interests"
          multiple
          required
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800 h-32"
        >
          {interests.map((i) => (
            <option key={i.id} value={i.name}>
              {i.name}
            </option>
          ))}
        </select>
        {state.errors?.interests && (
          <p className="text-xs text-red-400">{state.errors.interests.join(", ")}</p>
        )}
      </div>

      <SubmitButton text={dict.generateTrip.submit} />
    </form>
  );
}
