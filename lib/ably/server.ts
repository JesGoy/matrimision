import Ably from "ably"

import { getEnv } from "@/lib/env"

let ablyRestClient: Ably.Rest | undefined

export function getAblyServerClient(): Ably.Rest {
  if (!ablyRestClient) {
    const env = getEnv()
    ablyRestClient = new Ably.Rest(env.ABLY_API_KEY)
  }

  return ablyRestClient
}
