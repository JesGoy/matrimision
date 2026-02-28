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
  onComplete?: (missionId: string, evidenceImageData: string) => Promise<boolean>
}) {
  const [status, setStatus] = useState<MissionView["status"]>(mission.status)
  const [animating, setAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [evidenceImageData, setEvidenceImageData] = useState<string | null>(null)
  const [evidenceName, setEvidenceName] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const IconComponent = iconMap[mission.icon] || Star
  const isLocked = status === "locked"
  const isCompleted = status === "completed"

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
      reader.readAsDataURL(file)
    })
  }

  async function handleSelectEvidence(file: File | null) {
    setLocalError(null)

    if (!file) {
      setEvidenceImageData(null)
      setEvidenceName("")
      return
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("Solo se permiten imágenes")
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setLocalError("La imagen debe pesar máximo 3MB")
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setEvidenceImageData(dataUrl)
      setEvidenceName(file.name)
    } catch {
      setLocalError("No se pudo procesar la imagen")
    }
  }

  async function handleComplete() {
    if (isLocked || isCompleted) return

    if (!evidenceImageData) {
      setLocalError("Debes subir una foto para completar esta misión")
      return
    }

    setSubmitting(true)
    setLocalError(null)

    if (onComplete) {
      const wasCompleted = await onComplete(mission.id, evidenceImageData)
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
        isLocked && "overflow-hidden border-primary/25 bg-gradient-to-br from-card to-primary/10",
        isCompleted && "border-primary/30 bg-primary/5",
        !isLocked && !isCompleted && "border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5",
        animating && "scale-105"
      )}
    >
      {isLocked && (
        <>
          <div className="pointer-events-none absolute -top-16 -right-10 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-secondary/40 blur-2xl" />
        </>
      )}

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
              isLocked && "bg-primary/15",
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
              isLocked && "bg-primary/10 text-primary",
              !isLocked && !isCompleted && "bg-gold/10 text-foreground"
            )}
          >
            <Star className="h-3 w-3" />
            {isLocked ? "???" : `${mission.points} pts`}
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
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center">
            <p className="text-sm font-semibold text-foreground">Contenido bloqueado</p>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Se revelará en el momento perfecto</span>
            </div>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Check className="h-3 w-3" />
            <span>Completada</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/10">
              <Camera className="h-3.5 w-3.5 text-primary" />
              {evidenceName || "Subir foto de evidencia"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(event) => void handleSelectEvidence(event.target.files?.[0] ?? null)}
              />
            </label>

            {localError && <p className="text-xs text-destructive">{localError}</p>}

            <button
              onClick={handleComplete}
              disabled={submitting}
              className={cn(
                "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                animating && "animate-pulse",
                submitting && "opacity-80"
              )}
            >
              {submitting ? "Guardando..." : "Completar misión"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
