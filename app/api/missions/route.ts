import { eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { guestMissions, guests, missions } from "@/db/schema"
import { readGuestSessionFromRequest } from "@/lib/auth/session"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

function getIconFromTitle(title: string): string {
  const normalized = title.toLowerCase()

  if (normalized.includes("foto") || normalized.includes("cabina") || normalized.includes("selfie")) {
    return "camera"
  }
  if (normalized.includes("karaoke") || normalized.includes("canta") || normalized.includes("cancion") || normalized.includes("canción")) {
    return "music"
  }
  if (normalized.includes("dedicatoria") || normalized.includes("palabras") || normalized.includes("mensaje")) {
    return "book"
  }
  if (normalized.includes("alguien") || normalized.includes("pareja") || normalized.includes("grupal")) {
    return "users"
  }
  if (normalized.includes("vela")) {
    return "flower"
  }
  if (normalized.includes("baile") || normalized.includes("baila")) {
    return "sparkles"
  }
  if (normalized.includes("novios") || normalized.includes("amor")) {
    return "heart"
  }

  return "star"
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
    missions: allMissions.map((mission) => {
      const completed = completedIds.has(mission.id)
      const locked = !completed && !mission.active

      return {
        id: mission.id,
        title: locked ? "Misión secreta" : mission.title,
        description: locked
          ? "Pronto se desbloqueará una nueva sorpresa. Mantente atento 👀"
          : mission.description,
        points: locked ? 0 : mission.points,
        icon: locked ? "star" : getIconFromTitle(mission.title),
        status: completed ? "completed" : mission.active ? "available" : "locked",
      }
    }),
  })
}
