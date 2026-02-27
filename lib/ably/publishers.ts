import { getAblyServerClient } from "@/lib/ably/server"
import { MISSION_COMPLETED_EVENT, MISSIONS_CHANNEL } from "@/lib/ably/constants"

export type MissionCompletedEvent = {
  guestId: string
  guestName: string
  missionId: string
  missionTitle: string
  points: number
  completedAt: string
}

export async function publishMissionCompleted(event: MissionCompletedEvent): Promise<void> {
  const ably = getAblyServerClient()
  const channel = ably.channels.get(MISSIONS_CHANNEL)

  await channel.publish(MISSION_COMPLETED_EVENT, event)
}
