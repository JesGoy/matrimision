"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Star, Radio, Trophy } from "lucide-react"
import { LiveFeedItem } from "@/components/live-feed-item"
import { LeaderboardItem } from "@/components/leaderboard-item"
import { getAblyRealtimeClient } from "@/lib/ably/client"
import { MISSION_COMPLETED_EVENT, MISSIONS_CHANNEL } from "@/lib/ably/constants"
import type { FeedItem, LeaderboardGuest } from "@/lib/types/game"

type LeaderboardResponse = {
  leaderboard: Array<{
    guestId: string
    displayName: string
    totalPoints: number
  }>
}

type MissionCompletedEvent = {
  guestId: string
  guestName: string
  missionId: string
  missionTitle: string
  points: number
  completedAt: string
}

function toTimeLabel(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function LivePage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardGuest[]>([])

  async function loadLeaderboard() {
    const response = await fetch("/api/leaderboard")
    if (!response.ok) {
      return
    }

    const data = (await response.json()) as LeaderboardResponse
    setLeaderboard(
      data.leaderboard.map((row) => ({
        id: row.guestId,
        name: row.displayName,
        points: Number(row.totalPoints),
      }))
    )
  }

  useEffect(() => {
    void loadLeaderboard()

    const ably = getAblyRealtimeClient()
    const channel = ably.channels.get(MISSIONS_CHANNEL)

    const listener = (message: { data: MissionCompletedEvent }) => {
      const event = message.data
      const newItem: FeedItem = {
        id: `${event.guestId}-${event.missionId}-${event.completedAt}`,
        guestName: event.guestName,
        missionTitle: event.missionTitle,
        points: event.points,
        timestamp: toTimeLabel(event.completedAt),
      }

      setFeedItems((current) => [newItem, ...current].slice(0, 20))
      void loadLeaderboard()
    }

    channel.subscribe(MISSION_COMPLETED_EVENT, listener)

    return () => {
      channel.unsubscribe(MISSION_COMPLETED_EVENT, listener)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <span className="font-serif text-lg font-bold text-foreground">
              MatriMision
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              En vivo
            </span>
            <Link
              href="/missions"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Star className="h-3 w-3 text-primary" />
              Misiones
            </Link>
          </div>
        </div>
      </header>

      {/* Split layout */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left: Live feed */}
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl font-bold text-foreground">
                Actividad en vivo
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {feedItems.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Aun no hay actividad en vivo.
                </div>
              ) : feedItems.map((item) => (
                <LiveFeedItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div className="lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-20">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Ranking
                </h2>
              </div>
              <div className="rounded-2xl border border-border bg-card p-2">
                <div className="flex flex-col gap-1">
                  {leaderboard.map((guest, index) => (
                    <LeaderboardItem
                      key={guest.id}
                      guest={guest}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-6 px-4 py-3">
          <Link href="/missions" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Star className="h-5 w-5" />
            <span className="text-xs font-medium">Misiones</span>
          </Link>
          <Link href="/live" className="flex flex-col items-center gap-1 text-primary">
            <Radio className="h-5 w-5" />
            <span className="text-xs font-medium">En vivo</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
