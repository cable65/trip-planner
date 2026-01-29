import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCurrentUserLocale, getDictionary } from "@/lib/i18n";

import NotificationBell from "@/components/notification-bell";

export const metadata: Metadata = {
  title: "AI Trip Planner",
  description: "AI-powered trip planner and booking platform"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const locale = await getCurrentUserLocale();
  const dict = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              AI Trip Planner
            </Link>
            <nav className="flex items-center gap-4 text-sm text-neutral-300">
              {session?.user ? (
                <>
                  <Link href="/trips">{dict.nav.trips}</Link>
                  <Link href="/vendors">Marketplace</Link>
                  <Link href="/messages">Messages</Link>
                  <NotificationBell />
                  <Link href="/settings">{dict.nav.settings}</Link>
                  {(session.user as any).role === "admin" ? (
                    <Link href="/admin/audit-logs">{dict.nav.auditLogs}</Link>
                  ) : null}
                  <form action="/api/auth/signout" method="post">
                    <button className="rounded bg-neutral-800 px-3 py-1 hover:bg-neutral-700">
                      {dict.nav.signOut}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">{dict.nav.login}</Link>
                  <Link href="/register">{dict.nav.register}</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

