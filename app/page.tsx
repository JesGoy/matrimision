import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { guests } from "@/db/schema"
import { GUEST_SESSION_COOKIE, verifyGuestSession } from "@/lib/auth/session"
import { getDb } from "@/lib/db"

export default async function Home() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value

  if (!sessionToken) {
    redirect("/join")
  }

  const session = await verifyGuestSession(sessionToken)

  if (!session) {
    redirect("/join")
  }

  const db = getDb()
  const guest = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.id, session.guestId))
    .limit(1)

  if (guest.length === 0) {
    redirect("/join")
  }

  redirect("/missions")
}
