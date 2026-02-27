import { cn } from "@/lib/utils"
import { Trophy, Star } from "lucide-react"
import type { LeaderboardGuest } from "@/lib/types/game"

const rankStyles: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: "bg-[oklch(0.88_0.10_80)]", text: "text-[oklch(0.40_0.10_60)]", icon: "text-[oklch(0.60_0.12_60)]" },
  2: { bg: "bg-[oklch(0.90_0.01_250)]", text: "text-[oklch(0.45_0.02_250)]", icon: "text-[oklch(0.55_0.03_250)]" },
  3: { bg: "bg-[oklch(0.85_0.06_55)]", text: "text-[oklch(0.45_0.06_55)]", icon: "text-[oklch(0.55_0.06_55)]" },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function LeaderboardItem({
  guest,
  rank,
}: {
  guest: LeaderboardGuest
  rank: number
}) {
  const isTopThree = rank <= 3
  const style = rankStyles[rank]

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
        isTopThree ? "bg-card border border-border shadow-sm" : "hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isTopThree && style
            ? `${style.bg} ${style.text}`
            : "bg-muted text-muted-foreground"
        )}
      >
        {isTopThree ? (
          <Trophy className={cn("h-4 w-4", style?.icon)} />
        ) : (
          rank
        )}
      </div>

      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isTopThree
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {getInitials(guest.name)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {guest.name}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Star className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-bold text-foreground">{guest.points}</span>
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
    </div>
  )
}
