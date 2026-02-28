import { eq } from "drizzle-orm"
import { NextRequest } from "next/server"

import { guests } from "@/db/schema"
import { getDb } from "@/lib/db"
import { readGuestSessionFromRequest } from "@/lib/auth/session"

const ADMIN_DISPLAY_NAME = "adminBoda"

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const session = await readGuestSessionFromRequest(request)

  if (!session) {
    return false
  }

  const db = getDb()
  const guest = await db
    .select({ displayName: guests.displayName })
    .from(guests)
    .where(eq(guests.id, session.guestId))
    .limit(1)

  if (guest.length === 0) {
    return false
  }

  return normalizeName(guest[0].displayName) === normalizeName(ADMIN_DISPLAY_NAME)
}
