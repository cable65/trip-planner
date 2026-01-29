import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  PREFERRED_AI: z.enum(["openai", "deepseek"]).optional()
});

const parsed = EnvSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  PREFERRED_AI: process.env.PREFERRED_AI
});

if (!parsed.success) {
  const isBuild = process.env.NODE_ENV === "production" || process.env.NEXT_PHASE === "phase-production-build";
  
  if (isBuild) {
    console.warn("⚠️  Missing or invalid environment variables during build:", parsed.error.format());
  } else {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables. Check your .env file.");
  }
}

export const env = parsed.success ? parsed.data : {
  DATABASE_URL: process.env.DATABASE_URL || "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  PREFERRED_AI: (process.env.PREFERRED_AI as any) || "deepseek"
} as z.infer<typeof EnvSchema>;

