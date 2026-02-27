import { jwtVerify, SignJWT } from "jose"
import { NextRequest, NextResponse } from "next/server"

import { getEnv } from "@/lib/env"

export const GUEST_SESSION_COOKIE = "matrimision_guest_session"

export type GuestSessionPayload = {
  guestId: string
  code: string
}

const maxAgeSeconds = 60 * 60 * 24 * 7

function getJwtSecret() {
  const env = getEnv()
  const rawSecret = env.GUEST_SESSION_SECRET ?? env.ABLY_API_KEY
  return new TextEncoder().encode(rawSecret)
}

export async function signGuestSession(payload: GuestSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret())
}

export async function verifyGuestSession(token: string): Promise<GuestSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())

    if (typeof payload.guestId !== "string" || typeof payload.code !== "string") {
      return null
    }

    return {
      guestId: payload.guestId,
      code: payload.code,
    }
  } catch {
    return null
  }
}

export async function setGuestSessionCookie(
  response: NextResponse,
  payload: GuestSessionPayload
): Promise<void> {
  const env = getEnv()
  const token = await signGuestSession(payload)

  response.cookies.set(GUEST_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  })
}

export async function readGuestSessionFromRequest(
  request: NextRequest
): Promise<GuestSessionPayload | null> {
  const token = request.cookies.get(GUEST_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return verifyGuestSession(token)
}
