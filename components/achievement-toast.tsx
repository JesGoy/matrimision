"use client"

import { useEffect, useState } from "react"
import { Star, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AchievementToastProps {
  title: string
  points: number
  visible: boolean
  onClose: () => void
}

export function AchievementToast({ title, points, visible, onClose }: AchievementToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible && !show) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card px-5 py-3 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Mision completada</p>
          <p className="text-xs text-muted-foreground">
            {title} — <span className="font-bold text-primary">+{points} pts</span>
          </p>
        </div>
        <button
          onClick={() => {
            setShow(false)
            setTimeout(onClose, 300)
          }}
          className="ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar notificacion"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
