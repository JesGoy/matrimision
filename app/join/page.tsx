"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function JoinPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [showSimilar, setShowSimilar] = useState(false)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [similarNames, setSimilarNames] = useState<Array<{ id: string; displayName: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitJoin(displayName: string, guestId?: string) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName, guestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data?.error ?? "No se pudo iniciar la mision")
        return
      }

      if (data.status === "multiple") {
        const options = data.guests as Array<{ id: string; displayName: string }>
        setSimilarNames(options)
        setShowSimilar(true)
        return
      }

      router.push("/missions")
    } catch {
      setError("No se pudo conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalName = name.trim()
    if (!finalName) return

    await submitJoin(finalName, selectedGuestId ?? undefined)
  }

  async function handleSelectName(guest: { id: string; displayName: string }) {
    setSelectedGuestId(guest.id)
    setName(guest.displayName)
    setShowSimilar(false)
    await submitJoin(guest.displayName, guest.id)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blush/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Logo area */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">
              MatriMision
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              El juego de tu boda
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Bienvenido a la mision
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Ingresa tu nombre para comenzar a jugar y ganar puntos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Tu nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSelectedGuestId(null)
                  setShowSimilar(false)
                  setError(null)
                }}
                placeholder="Ej: Camila Rodriguez"
                className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                autoComplete="name"
                required
              />
            </div>

            {/* Similar names dropdown */}
            {showSimilar && (
              <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-2">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Encontramos nombres similares:
                </p>
                {similarNames.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => void handleSelectName(guest)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                      selectedGuestId === guest.id && "bg-primary/5 text-primary"
                    )}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {guest.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-foreground">{guest.displayName}</span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              {loading ? "Entrando..." : "Comenzar mision"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
          Completa misiones, gana puntos y celebra el amor.
        </p>
      </div>
    </main>
  )
}
