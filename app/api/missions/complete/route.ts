import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { guestMissions, guests, missions } from "@/db/schema"
import { publishMissionCompleted } from "@/lib/ably/publishers"
import { readGuestSessionFromRequest } from "@/lib/auth/session"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

const completeMissionSchema = z.object({
  missionId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const db = getDb()
  const session = await readGuestSessionFromRequest(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsedBody = completeMissionSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { missionId } = parsedBody.data

  const mission = await db
    .select({
      id: missions.id,
      title: missions.title,
      points: missions.points,
      active: missions.active,
    })
    .from(missions)
    .where(and(eq(missions.id, missionId), eq(missions.active, true)))
    .limit(1)

  if (mission.length === 0) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  }

  const inserted = await db
    .insert(guestMissions)
    .values({
      guestId: session.guestId,
      missionId,
    })
    .onConflictDoNothing()
    .returning({
      guestId: guestMissions.guestId,
      missionId: guestMissions.missionId,
      completedAt: guestMissions.completedAt,
    })

  if (inserted.length === 0) {
    return NextResponse.json({ error: "Mission already completed" }, { status: 409 })
  }

  const completion = inserted[0]

  await db
    .update(guests)
    .set({
      lastSeenAt: new Date(),
    })
    .where(eq(guests.id, session.guestId))

  const guest = await db
    .select({
      id: guests.id,
      displayName: guests.displayName,
    })
    .from(guests)
    .where(eq(guests.id, session.guestId))
    .limit(1)

  if (guest.length === 0) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 })
  }

  const missionData = mission[0]
  const guestData = guest[0]

  await publishMissionCompleted({
    guestId: completion.guestId,
    guestName: guestData.displayName,
    missionId: completion.missionId,
    missionTitle: missionData.title,
    points: missionData.points,
    completedAt: completion.completedAt.toISOString(),
  })

  return NextResponse.json({
    status: "completed",
    guestMission: completion,
    mission: {
      id: missionData.id,
      title: missionData.title,
      points: missionData.points,
    },
  })
}
