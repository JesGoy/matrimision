import { asc, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { missions } from "@/db/schema"
import { getDb } from "@/lib/db"

export const runtime = "nodejs"

const createMissionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(500),
  points: z.number().int().min(1).max(999),
  active: z.boolean().default(true),
})

const updateMissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(8).max(500),
  points: z.number().int().min(1).max(999),
  active: z.boolean(),
})

export async function GET() {
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
  const db = getDb()
  const parsedBody = createMissionSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
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

  return NextResponse.json({ mission: inserted[0] }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const db = getDb()
  const parsedBody = updateMissionSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
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

  return NextResponse.json({ mission: updated[0] })
}
