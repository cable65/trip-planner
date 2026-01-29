import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await appendAuditLog({
            actorId: null,
            actorRole: null,
            action: "USER_LOGIN_FAILED",
            resourceType: "User",
            resourceId: null,
            metadata: { email }
          });
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          await appendAuditLog({
            actorId: user.id,
            actorRole: user.role,
            action: "USER_LOGIN_FAILED",
            resourceType: "User",
            resourceId: user.id,
            metadata: { reason: "bad_password" }
          });
          return null;
        }

        await appendAuditLog({
          actorId: user.id,
          actorRole: user.role,
          action: "USER_LOGIN_SUCCESS",
          resourceType: "User",
          resourceId: user.id
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = (token as any).id;
      (session.user as any).role = (token as any).role;
      return session;
    }
  }
};

export async function getSession() {
  const { getServerSession } = await import("next-auth");
  return getServerSession(authOptions);
}

