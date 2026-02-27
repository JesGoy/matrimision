import { eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { guestMissions, guests, missions } from "@/db/schema"
import { readGuestSessionFromRequest } from "@/lib/auth/session"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

const iconMap: Record<string, string> = {
  "selfie con los novios": "camera",
  "primer baile": "music",
  "mensaje en el libro": "book",
  "foto grupal": "users",
  "brindis especial": "wine",
  "ramo de la novia": "flower",
  "pista de baile": "sparkles",
  "historia de amor": "heart",
}

function getIconFromTitle(title: string): string {
  const normalized = title.toLowerCase()
  return iconMap[normalized] ?? "star"
}

export async function GET(request: NextRequest) {
  const db = getDb()
  const session = await readGuestSessionFromRequest(request)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const guest = await db
    .select({
      id: guests.id,
      displayName: guests.displayName,
      code: guests.code,
    })
    .from(guests)
    .where(eq(guests.id, session.guestId))
    .limit(1)

  if (guest.length === 0) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 })
  }

  const allMissions = await db
    .select({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      points: missions.points,
      active: missions.active,
    })
    .from(missions)

  const completedMissions = await db
    .select({ missionId: guestMissions.missionId })
    .from(guestMissions)
    .where(eq(guestMissions.guestId, session.guestId))

  const completedIds = new Set(completedMissions.map((row) => row.missionId))

  const totalPointsResult = await db
    .select({
      totalPoints: sql<number>`coalesce(sum(${missions.points}), 0)`,
    })
    .from(guestMissions)
    .leftJoin(missions, eq(missions.id, guestMissions.missionId))
    .where(eq(guestMissions.guestId, session.guestId))

  const totalPoints = Number(totalPointsResult[0]?.totalPoints ?? 0)

  return NextResponse.json({
    guest: guest[0],
    totalPoints,
    missions: allMissions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      points: mission.points,
      icon: getIconFromTitle(mission.title),
      status: completedIds.has(mission.id)
        ? "completed"
        : mission.active
          ? "available"
          : "locked",
    })),
  })
}
