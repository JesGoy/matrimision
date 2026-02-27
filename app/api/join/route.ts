import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { guests } from "@/db/schema"
import { generateUniqueGuestCode } from "@/lib/auth/guest-code"
import { setGuestSessionCookie } from "@/lib/auth/session"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

const joinSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  guestId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const db = getDb()
  const parsedBody = joinSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { displayName, guestId } = parsedBody.data

  if (guestId) {
    const selectedGuest = await db
      .select({
        id: guests.id,
        displayName: guests.displayName,
        code: guests.code,
        createdAt: guests.createdAt,
        lastSeenAt: guests.lastSeenAt,
      })
      .from(guests)
      .where(and(eq(guests.id, guestId), eq(guests.displayName, displayName)))
      .limit(1)

    if (selectedGuest.length === 0) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 })
    }

    const guest = selectedGuest[0]

    await db
      .update(guests)
      .set({
        lastSeenAt: new Date(),
      })
      .where(eq(guests.id, guest.id))

    const response = NextResponse.json({
      status: "joined",
      guest,
    })

    await setGuestSessionCookie(response, {
      guestId: guest.id,
      code: guest.code,
    })

    return response
  }

  const matches = await db
    .select({
      id: guests.id,
      displayName: guests.displayName,
      code: guests.code,
      createdAt: guests.createdAt,
      lastSeenAt: guests.lastSeenAt,
    })
    .from(guests)
    .where(eq(guests.displayName, displayName))

  if (matches.length > 1) {
    return NextResponse.json({
      status: "multiple",
      guests: matches,
    })
  }

  if (matches.length === 1) {
    const guest = matches[0]

    await db
      .update(guests)
      .set({
        lastSeenAt: new Date(),
      })
      .where(eq(guests.id, guest.id))

    const response = NextResponse.json({
      status: "joined",
      guest,
    })

    await setGuestSessionCookie(response, {
      guestId: guest.id,
      code: guest.code,
    })

    return response
  }

  const code = await generateUniqueGuestCode(async (candidateCode) => {
    const existing = await db
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.code, candidateCode))
      .limit(1)

    return existing.length > 0
  })

  const inserted = await db
    .insert(guests)
    .values({
      displayName,
      code,
      lastSeenAt: new Date(),
    })
    .returning({
      id: guests.id,
      displayName: guests.displayName,
      code: guests.code,
      createdAt: guests.createdAt,
      lastSeenAt: guests.lastSeenAt,
    })

  const guest = inserted[0]

  const response = NextResponse.json({
    status: "created",
    guest,
  })

  await setGuestSessionCookie(response, {
    guestId: guest.id,
    code: guest.code,
  })

  return response
}
