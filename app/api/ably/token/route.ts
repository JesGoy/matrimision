import { NextRequest, NextResponse } from "next/server"

import { getAblyServerClient } from "@/lib/ably/server"
import { readGuestSessionFromRequest } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const session = await readGuestSessionFromRequest(request)
  const ably = getAblyServerClient()

  const tokenRequest = await ably.auth.createTokenRequest({
    clientId: session?.guestId ?? "anonymous",
  })

  return NextResponse.json(tokenRequest)
}
