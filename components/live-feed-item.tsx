import type { FeedItem } from "@/lib/types/game"
import { Star } from "lucide-react"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function LiveFeedItem({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {getInitials(item.guestName)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-semibold">{item.guestName}</span>
          {" completo "}
          <span className="font-medium text-primary">
            {`'${item.missionTitle}'`}
          </span>
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Star className="h-3 w-3" />
            +{item.points} pts
          </span>
          <span className="text-xs text-muted-foreground">{item.timestamp}</span>
        </div>
      </div>
    </div>
  )
}
