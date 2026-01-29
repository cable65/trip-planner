import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/lib/audit";
import { runWithAuditContext } from "@/lib/audit-context";

const RegisterSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) redirect("/trips");

  async function registerAction(formData: FormData) {
    "use server";

    const parsed = RegisterSchema.safeParse({
      name: String(formData.get("name") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    });
    if (!parsed.success) return;

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "admin" : "traveler";

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await runWithAuditContext(
      { actorId: null, actorRole: null, ipAddress: null, userAgent: null },
      () =>
        prisma.user.create({
          data: {
            email,
            name: parsed.data.name,
            passwordHash,
            role,
            preferences: {}
          }
        })
    );

    await appendAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_REGISTERED",
      resourceType: "User",
      resourceId: user.id,
      oldValue: null,
      newValue: { id: user.id, email: user.email, role: user.role }
    });

    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form
        action={registerAction}
        className="space-y-4 rounded border border-neutral-800 p-5"
      >
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800 focus:ring-indigo-600"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
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
            className="w-full rounded bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800 focus:ring-indigo-600"
          />
          <p className="text-xs text-neutral-500">Minimum 8 characters.</p>
        </div>
        <button className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          Create account
        </button>
      </form>
    </div>
  );
}

