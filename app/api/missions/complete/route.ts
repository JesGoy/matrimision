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
  evidenceImageData: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[a-zA-Z0-9+/=]+$/i, "Invalid image format"),
})

function getBase64Bytes(dataUrl: string): number {
  const parts = dataUrl.split(",")
  const base64 = parts[1] ?? ""
  const padding = (base64.match(/=+$/)?.[0].length ?? 0)
  return (base64.length * 3) / 4 - padding
}

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

  const { missionId, evidenceImageData } = parsedBody.data

  const maxBytes = 3 * 1024 * 1024
  if (getBase64Bytes(evidenceImageData) > maxBytes) {
    return NextResponse.json({ error: "Image too large. Max size is 3MB" }, { status: 400 })
  }

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
      evidenceImageData,
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
