"use client"

import { Suspense } from "react"
import { MissionsContent } from "./missions-content"

export default function MissionsPage() {
  return (
    <Suspense fallback={<MissionsLoading />}>
      <MissionsContent />
    </Suspense>
  )
}

function MissionsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
