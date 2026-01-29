import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "vendor") redirect("/vendor/dashboard");
    if (role === "admin") redirect("/admin");
    redirect("/trips");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <LoginForm />
    </div>
  );
}

