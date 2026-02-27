import { missions } from "../db/schema"
import { getDb } from "../lib/db"

const seedMissions = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Selfie con los novios",
    description: "Tomate una selfie con la pareja y comparte el momento.",
    points: 20,
    active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Primer baile",
    description: "Graba un video del primer baile de los novios.",
    points: 15,
    active: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Mensaje en el libro",
    description: "Deja un mensaje especial en el libro de invitados.",
    points: 10,
    active: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    title: "Foto grupal",
    description: "Participa en la foto grupal con todos los invitados.",
    points: 25,
    active: true,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    title: "Brindis especial",
    description: "Haz un brindis dedicado a los novios.",
    points: 30,
    active: false,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    title: "Ramo de la novia",
    description: "Participa en el lanzamiento del ramo.",
    points: 20,
    active: false,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    title: "Pista de baile",
    description: "Se el primero en abrir la pista de baile.",
    points: 15,
    active: true,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    title: "Historia de amor",
    description: "Cuenta como conociste a los novios en una historia breve.",
    points: 20,
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
