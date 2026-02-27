import { asc, desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

import { guestMissions, guests, missions } from "@/db/schema"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  const db = getDb()
  const rows = await db
    .select({
      guestId: guests.id,
      displayName: guests.displayName,
      code: guests.code,
      totalPoints: sql<number>`coalesce(sum(${missions.points}), 0)`,
      missionsCompleted: sql<number>`count(${guestMissions.missionId})`,
      lastSeenAt: guests.lastSeenAt,
    })
    .from(guests)
    .leftJoin(guestMissions, eq(guestMissions.guestId, guests.id))
    .leftJoin(missions, eq(missions.id, guestMissions.missionId))
    .groupBy(guests.id)
    .orderBy(desc(sql`coalesce(sum(${missions.points}), 0)`), asc(guests.displayName))

  return NextResponse.json({
    leaderboard: rows,
  })
}
