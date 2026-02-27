import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "@/db/schema"
import { getEnv } from "@/lib/env"

let dbInstance: ReturnType<typeof drizzle> | undefined

export function getDb() {
  if (!dbInstance) {
    const env = getEnv()
    const sql = neon(env.DATABASE_URL)

    dbInstance = drizzle(sql, {
      schema,
      logger: env.NODE_ENV === "development",
    })
  }

  return dbInstance
}
