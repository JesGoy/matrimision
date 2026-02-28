import { getAblyServerClient } from "@/lib/ably/server"
import {
  MISSION_COMPLETED_EVENT,
  MISSIONS_CHANNEL,
  MISSION_UPDATED_EVENT,
} from "@/lib/ably/constants"

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

export type MissionUpdatedEvent = {
  missionId: string
  title: string
  active: boolean
  updatedAt: string
}

export async function publishMissionUpdated(event: MissionUpdatedEvent): Promise<void> {
  const ably = getAblyServerClient()
  const channel = ably.channels.get(MISSIONS_CHANNEL)

  await channel.publish(MISSION_UPDATED_EVENT, event)
}
