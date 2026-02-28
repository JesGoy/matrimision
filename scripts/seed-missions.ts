import { loadEnvConfig } from "@next/env"

import { missions } from "../db/schema"
import { getDb } from "../lib/db"

loadEnvConfig(process.cwd())

const seedMissions = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Foto con alguien nuevo",
    description: "Sácate una foto con alguien que no conocías antes del matrimonio y súbela a nuestro álbum compartido.",
    points: 20,
    active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Canta en el karaoke",
    description: "Canta una canción en el karaoke.",
    points: 15,
    active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Baila con alguien",
    description: "Baila con tu pareja o con alguien que no conocías.",
    points: 10,
    active: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Foto de tu comida favorita",
    description: "Sácate una foto con la comida que más te gustó del matrimonio y súbela a nuestro álbum compartido.",
    points: 25,
    active: true,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Enciende una vela",
    description: "Cuando sea la hora de las velas, enciende una.",
    points: 15,
    active: true,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Foto en la cabina",
    description: "Tómate una foto en la cabina fotográfica.",
    points: 20,
    active: true,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Foto de los novios",
    description: "Sube cualquier foto de los novios al álbum.",
    points: 15,
    active: true,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    title: "Dedicatoria para los novios",
    description: "Dale unas palabras a los novios o deja una dedicatoria escrita.",
    points: 20,
    active: true,
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    title: "Autorretrato en el lienzo",
    description: "Haz tu autorretrato en el lienzo de los novios.",
    points: 25,
    active: true,
  },
] as const

async function run() {
  const db = getDb()

  for (const mission of seedMissions) {
    await db
      .insert(missions)
      .values(mission)
      .onConflictDoUpdate({
        target: missions.id,
        set: {
          title: mission.title,
          description: mission.description,
          points: mission.points,
          active: mission.active,
        },
      })
  }

  console.log(`Seed completed: ${seedMissions.length} missions upserted.`)
}

run().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
