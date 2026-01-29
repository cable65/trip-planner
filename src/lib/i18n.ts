import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  zh: () => import("@/dictionaries/zh.json").then((module) => module.default),
  ms: () => import("@/dictionaries/ms.json").then((module) => module.default)
};

export type Locale = keyof typeof dictionaries;

export async function getDictionary(locale: string) {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale]();
  }
  return dictionaries.en();
}

export async function getCurrentUserLocale(): Promise<string> {
  const session = await getSession();
  if (!session?.user) return "en";

  const userId = (session.user as any).id as string;
  // Fetch fresh preferences from DB to ensure immediate update reflection
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true }
  });

  return (user?.preferences as any)?.language || "en";
}
