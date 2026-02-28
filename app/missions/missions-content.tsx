"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Star, Radio, Heart } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { MissionCard } from "@/components/mission-card"
import { getAblyRealtimeClient } from "@/lib/ably/client"
import { MISSION_UPDATED_EVENT, MISSIONS_CHANNEL } from "@/lib/ably/constants"
import type { MissionView } from "@/lib/types/game"

type MissionsResponse = {
  guest: {
    id: string
    displayName: string
    code: string
  }
  totalPoints: number
  missions: MissionView[]
}

export function MissionsContent() {
  const searchParams = useSearchParams()
  const [guestName, setGuestName] = useState(searchParams.get("name") || "Invitado")
  const [missions, setMissions] = useState<MissionView[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const missionsRef = useRef<MissionView[]>([])

  async function loadMissions() {
    try {
      setError(null)
      const response = await fetch("/api/missions", {
        method: "GET",
      })

      if (response.status === 401) {
        window.location.href = "/join"
        return
      }

      const data = (await response.json()) as MissionsResponse | { error?: string }

      if (!response.ok || !("missions" in data)) {
        setError((data as { error?: string }).error ?? "No se pudieron cargar las misiones")
        return
      }

      setGuestName(data.guest.displayName)

      if (hasLoadedOnceRef.current) {
        const previousStatusById = new Map(
          missionsRef.current.map((mission) => [mission.id, mission.status])
        )

        data.missions.forEach((mission) => {
          const previousStatus = previousStatusById.get(mission.id)

          if (previousStatus === "locked" && mission.status === "available") {
            toast.success("Nueva misión desbloqueada", {
              description: mission.title,
            })
          }

          if (previousStatus === "available" && mission.status === "locked") {
            toast("Misión bloqueada", {
              description: mission.title,
            })
          }
        })
      }

      setMissions(data.missions)
      missionsRef.current = data.missions
      setTotalPoints(data.totalPoints)
      hasLoadedOnceRef.current = true
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMissions()

    const ably = getAblyRealtimeClient()
    const channel = ably.channels.get(MISSIONS_CHANNEL)

    const listener = () => {
      void loadMissions()
    }

    channel.subscribe(MISSION_UPDATED_EVENT, listener)

    return () => {
      channel.unsubscribe(MISSION_UPDATED_EVENT, listener)
    }
  }, [])

  const completedCount = missions.filter((m) => m.status === "completed").length
  const progressPercent = missions.length > 0 ? Math.round((completedCount / missions.length) * 100) : 0

  async function handleCompleteMission(missionId: string, evidenceImageData: string) {
    const response = await fetch("/api/missions/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ missionId, evidenceImageData }),
    })

    if (response.status === 401) {
      window.location.href = "/join"
      return false
    }

    if (response.status === 409) {
      await loadMissions()
      return true
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? "No se pudo completar la misión")
      return false
    }

    const data = (await response.json()) as {
      mission: {
        id: string
        points: number
      }
    }

    setMissions((current) => {
      const next = current.map((mission) =>
        mission.id === missionId ? { ...mission, status: "completed" } : mission
      )
      missionsRef.current = next
      return next
    })

    setTotalPoints((currentPoints) => currentPoints + data.mission.points)
    return true
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    })

    window.location.href = "/join"
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{guestName}</p>
              <p className="text-xs text-muted-foreground">Misionero</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Salir
            </button>
            <Link
              href="/live"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Radio className="h-3 w-3 text-primary" />
              En vivo
            </Link>
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-bold text-foreground">{totalPoints}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              Progreso de misiones
            </span>
            <span className="text-xs font-medium text-foreground">
              {completedCount}/{missions.length} completadas
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-muted" />
        </div>
      </header>

      {/* Missions title */}
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Tus misiones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Completa las misiones para ganar puntos y subir en el ranking.
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      {/* Mission grid */}
      <div className="mx-auto max-w-3xl px-4 pb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={handleCompleteMission}
            />
          ))}
        </div>
      </div>

      {/* Bottom nav hint */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-6 px-4 py-3">
          <Link href="/missions" className="flex flex-col items-center gap-1 text-primary">
            <Star className="h-5 w-5" />
            <span className="text-xs font-medium">Misiones</span>
          </Link>
          <Link href="/live" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Radio className="h-5 w-5" />
            <span className="text-xs font-medium">En vivo</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
