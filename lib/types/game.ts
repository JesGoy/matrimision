export type MissionStatus = "locked" | "available" | "completed"

export interface MissionView {
  id: string
  title: string
  description: string
  points: number
  status: MissionStatus
  icon: string
}

export interface LeaderboardGuest {
  id: string
  name: string
  points: number
}

export interface FeedItem {
  id: string
  guestName: string
  missionTitle: string
  points: number
  timestamp: string
}
