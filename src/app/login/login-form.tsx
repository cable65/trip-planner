"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded border border-neutral-800 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false
          });

          if (res?.error) {
            setError("Invalid email or password.");
          } else {
            router.refresh();
          }
        });
      }}
    >
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800 focus:ring-indigo-600"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-neutral-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800 focus:ring-indigo-600"
        />
      </div>
      {error ? <div className="text-sm text-red-400">{error}</div> : null}
      <button
        disabled={isPending}
        className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 space-y-3 border-t border-neutral-800 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-neutral-500">
              Dev Access
            </p>
            <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-500">
              DEV ONLY
            </span>
          </div>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@trip-planner.com");
                setPassword("abcd1234");
              }}
              className="group relative flex w-full items-center justify-between rounded border border-red-900/30 bg-red-900/10 px-3 py-2 text-sm text-red-200 transition-colors hover:bg-red-900/20"
              title="Development only: Auto-fill Admin credentials"
            >
              <span>Admin Login</span>
              <span className="text-xs opacity-50">admin@trip-planner.com</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setEmail("vendor@trip-planner.com");
                setPassword("abcd1234");
              }}
              className="group relative flex w-full items-center justify-between rounded border border-blue-900/30 bg-blue-900/10 px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-blue-900/20"
              title="Development only: Auto-fill Vendor credentials"
            >
              <span>Vendor Login</span>
              <span className="text-xs opacity-50">vendor@trip-planner.com</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("traveler@trip-planner.com");
                setPassword("abcd1234");
              }}
              className="group relative flex w-full items-center justify-between rounded border border-green-900/30 bg-green-900/10 px-3 py-2 text-sm text-green-200 transition-colors hover:bg-green-900/20"
              title="Development only: Auto-fill Traveler credentials"
            >
              <span>Traveler Login</span>
              <span className="text-xs opacity-50">traveler@trip-planner.com</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

