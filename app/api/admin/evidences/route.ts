import { and, desc, eq, isNotNull } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { guestMissions, guests, missions } from "@/db/schema"
import { isAdminRequest } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminRequest(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = getDb()
  const missionId = request.nextUrl.searchParams.get("missionId")

  const whereClause = missionId
    ? and(isNotNull(guestMissions.evidenceImageData), eq(guestMissions.missionId, missionId))
    : isNotNull(guestMissions.evidenceImageData)

  const rows = await db
    .select({
      guestId: guestMissions.guestId,
      guestName: guests.displayName,
      missionId: guestMissions.missionId,
      missionTitle: missions.title,
      completedAt: guestMissions.completedAt,
      evidenceImageData: guestMissions.evidenceImageData,
    })
    .from(guestMissions)
    .innerJoin(guests, eq(guests.id, guestMissions.guestId))
    .innerJoin(missions, eq(missions.id, guestMissions.missionId))
    .where(whereClause)
    .orderBy(desc(guestMissions.completedAt))

  return NextResponse.json({
    evidences: rows.map((row) => ({
      guestId: row.guestId,
      guestName: row.guestName,
      missionId: row.missionId,
      missionTitle: row.missionTitle,
      completedAt: row.completedAt.toISOString(),
      evidenceImageData: row.evidenceImageData,
    })),
  })
}
