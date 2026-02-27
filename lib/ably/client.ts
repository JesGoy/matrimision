"use client"

import Ably from "ably"

let realtimeClient: Ably.Realtime | undefined

export function getAblyRealtimeClient(): Ably.Realtime {
  if (!realtimeClient) {
    realtimeClient = new Ably.Realtime({
      authUrl: "/api/ably/token",
      autoConnect: true,
    })
  }

  return realtimeClient
}
