import { asc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { missions } from "@/db/schema"
import { publishMissionUpdated } from "@/lib/ably/publishers"
import { isAdminRequest } from "@/lib/auth/admin"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

const createMissionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(500),
  points: z.coerce.number().int().min(1).max(999),
  active: z.boolean().default(true),
})

const updateMissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(500),
  points: z.coerce.number().int().min(1).max(999),
  active: z.boolean(),
})

function getValidationMessage(error: z.ZodError) {
  const firstIssue = error.issues[0]
  if (!firstIssue) {
    return "Datos inválidos"
  }

  const field = firstIssue.path[0]
  if (field === "title") {
    return "El título debe tener entre 3 y 120 caracteres"
  }
  if (field === "description") {
    return "La descripción debe tener entre 8 y 500 caracteres"
  }
  if (field === "points") {
    return "Los puntos deben ser un número entero entre 1 y 999"
  }

  return "Datos inválidos"
}

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminRequest(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = getDb()

  const allMissions = await db
    .select({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      points: missions.points,
      active: missions.active,
    })
    .from(missions)
    .orderBy(asc(missions.title))

  return NextResponse.json({ missions: allMissions })
}

export async function POST(request: NextRequest) {
  const isAdmin = await isAdminRequest(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = getDb()
  const parsedBody = createMissionSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: getValidationMessage(parsedBody.error),
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    )
  }

  const inserted = await db
    .insert(missions)
    .values(parsedBody.data)
    .returning({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      points: missions.points,
      active: missions.active,
    })

  const mission = inserted[0]

  try {
    await publishMissionUpdated({
      missionId: mission.id,
      title: mission.title,
      active: mission.active,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    // Avoid failing admin action if realtime publish fails
  }

  return NextResponse.json({ mission }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await isAdminRequest(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const db = getDb()
  const parsedBody = updateMissionSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: getValidationMessage(parsedBody.error),
        details: parsedBody.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { id, ...values } = parsedBody.data

  const updated = await db
    .update(missions)
    .set(values)
    .where(eq(missions.id, id))
    .returning({
      id: missions.id,
      title: missions.title,
      description: missions.description,
      points: missions.points,
      active: missions.active,
    })

  if (updated.length === 0) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 })
  }

  const mission = updated[0]

  try {
    await publishMissionUpdated({
      missionId: mission.id,
      title: mission.title,
      active: mission.active,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    // Avoid failing admin action if realtime publish fails
  }

  return NextResponse.json({ mission })
}
