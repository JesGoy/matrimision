import { NextResponse } from "next/server"

import { GUEST_SESSION_COOKIE } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function POST() {
  const response = NextResponse.json({ status: "ok" })

  response.cookies.set(GUEST_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
