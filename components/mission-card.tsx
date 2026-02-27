"use client"

import { useState } from "react"
import {
  Camera,
  Music,
  BookOpen,
  Users,
  Wine,
  Flower2,
  Sparkles,
  Heart,
  Lock,
  Check,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MissionView } from "@/lib/types/game"

const iconMap: Record<string, React.ElementType> = {
  camera: Camera,
  music: Music,
  book: BookOpen,
  users: Users,
  wine: Wine,
  flower: Flower2,
  sparkles: Sparkles,
  heart: Heart,
}

export function MissionCard({
  mission,
  onComplete,
}: {
  mission: MissionView
  onComplete?: (missionId: string) => Promise<boolean>
}) {
  const [status, setStatus] = useState<MissionView["status"]>(mission.status)
  const [animating, setAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const IconComponent = iconMap[mission.icon] || Star
  const isLocked = status === "locked"
  const isCompleted = status === "completed"

  async function handleComplete() {
    if (isLocked || isCompleted) return
    setSubmitting(true)

    if (onComplete) {
      const wasCompleted = await onComplete(mission.id)
      if (!wasCompleted) {
        setSubmitting(false)
        return
      }
    }

    setAnimating(true)
    setTimeout(() => {
      setStatus("completed")
      setAnimating(false)
      setSubmitting(false)
    }, 600)
  }

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300",
        isLocked && "border-border bg-muted/50 opacity-60",
        isCompleted && "border-primary/30 bg-primary/5",
        !isLocked && !isCompleted && "border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5",
        animating && "scale-105"
      )}
    >
      {isCompleted && (
        <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isLocked && "bg-muted",
              isCompleted && "bg-primary/10",
              !isLocked && !isCompleted && "bg-gold/10"
            )}
          >
            {isLocked ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <IconComponent
                className={cn(
                  "h-5 w-5",
                  isCompleted ? "text-primary" : "text-gold"
                )}
              />
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isCompleted && "bg-primary/10 text-primary",
              isLocked && "bg-muted text-muted-foreground",
              !isLocked && !isCompleted && "bg-gold/10 text-foreground"
            )}
          >
            <Star className="h-3 w-3" />
            {mission.points} pts
          </span>
        </div>

        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
            {mission.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {mission.description}
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isLocked ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Bloqueada</span>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Check className="h-3 w-3" />
            <span>Completada</span>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={submitting}
            className={cn(
              "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
              animating && "animate-pulse",
              submitting && "opacity-80"
            )}
          >
            {submitting ? "Guardando..." : "Completar mision"}
          </button>
        )}
      </div>
    </div>
  )
}
