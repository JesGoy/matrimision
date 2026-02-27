import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  ABLY_API_KEY: z.string().min(1),
  GUEST_SESSION_SECRET: z.string().min(16).optional(),
})

type Env = z.infer<typeof envSchema>

let cachedEnv: Env | undefined

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      ABLY_API_KEY: process.env.ABLY_API_KEY,
      GUEST_SESSION_SECRET: process.env.GUEST_SESSION_SECRET,
    })
  }

  return cachedEnv
}
