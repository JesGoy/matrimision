"use client"

import { useEffect, useMemo, useState } from "react"
import { PlusCircle, Save, Lock, Unlock, Sparkles, ImageIcon } from "lucide-react"

type AdminMission = {
  id: string
  title: string
  description: string
  points: number
  active: boolean
}

type DraftMission = {
  title: string
  description: string
  points: string
  active: boolean
}

type EvidenceItem = {
  guestId: string
  guestName: string
  missionId: string
  missionTitle: string
  completedAt: string
  evidenceImageData: string | null
}

const emptyDraft: DraftMission = {
  title: "",
  description: "",
  points: "20",
  active: true,
}

function validateMissionInput(input: DraftMission): string | null {
  const title = input.title.trim()
  const description = input.description.trim()
  const points = Number(input.points)

  if (title.length < 3 || title.length > 120) {
    return "El título debe tener entre 3 y 120 caracteres"
  }
  if (description.length < 8 || description.length > 500) {
    return "La descripción debe tener entre 8 y 500 caracteres"
  }
  if (!Number.isInteger(points) || points < 1 || points > 999) {
    return "Los puntos deben ser un número entero entre 1 y 999"
  }

  return null
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<AdminMission[]>([])
  const [drafts, setDrafts] = useState<Record<string, DraftMission>>({})
  const [newMission, setNewMission] = useState<DraftMission>(emptyDraft)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [evidences, setEvidences] = useState<EvidenceItem[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(true)
  const [selectedMissionId, setSelectedMissionId] = useState<string>("all")
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState<number | null>(null)
  const [forbidden, setForbidden] = useState(false)

  async function loadMissions() {
    setError(null)
    setForbidden(false)
    const response = await fetch("/api/admin/missions")
    const data = (await response.json()) as { missions?: AdminMission[]; error?: string }

    if (response.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }

    if (!response.ok || !data.missions) {
      setError(data.error ?? "No se pudieron cargar las misiones")
      setLoading(false)
      return
    }

    setMissions(data.missions)
    setDrafts(
      Object.fromEntries(
        data.missions.map((mission) => [
          mission.id,
          {
            title: mission.title,
            description: mission.description,
            points: String(mission.points),
            active: mission.active,
          },
        ])
      )
    )
    setLoading(false)
  }

  useEffect(() => {
    void loadMissions()
  }, [])

  async function loadEvidences(missionId?: string) {
    setEvidenceLoading(true)
    const query = missionId && missionId !== "all" ? `?missionId=${missionId}` : ""
    const response = await fetch(`/api/admin/evidences${query}`)
    const data = (await response.json()) as { evidences?: EvidenceItem[] }
    setEvidences(data.evidences ?? [])
    setEvidenceLoading(false)
  }

  useEffect(() => {
    void loadEvidences(selectedMissionId)
  }, [selectedMissionId])

  const selectedEvidence =
    selectedEvidenceIndex !== null && selectedEvidenceIndex >= 0 && selectedEvidenceIndex < evidences.length
      ? evidences[selectedEvidenceIndex]
      : null

  useEffect(() => {
    if (selectedEvidenceIndex !== null && selectedEvidenceIndex >= evidences.length) {
      setSelectedEvidenceIndex(null)
    }
  }, [evidences, selectedEvidenceIndex])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (selectedEvidenceIndex === null) return

      if (event.key === "Escape") {
        setSelectedEvidenceIndex(null)
        return
      }

      if (event.key === "ArrowRight") {
        setSelectedEvidenceIndex((current) => {
          if (current === null || evidences.length === 0) return current
          return (current + 1) % evidences.length
        })
      }

      if (event.key === "ArrowLeft") {
        setSelectedEvidenceIndex((current) => {
          if (current === null || evidences.length === 0) return current
          return current === 0 ? evidences.length - 1 : current - 1
        })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedEvidenceIndex, evidences.length])

  const sortedMissions = useMemo(
    () => [...missions].sort((a, b) => Number(a.active) - Number(b.active)).reverse(),
    [missions]
  )

  const evidenceMissions = useMemo(
    () => [...missions].sort((a, b) => a.title.localeCompare(b.title)),
    [missions]
  )

  async function createMission() {
    const validationError = validateMissionInput(newMission)
    if (validationError) {
      setError(validationError)
      setSuccess(null)
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)

    const response = await fetch("/api/admin/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newMission.title.trim(),
        description: newMission.description.trim(),
        points: Number(newMission.points),
        active: newMission.active,
      }),
    })

    const data = (await response.json()) as { mission?: AdminMission; error?: string }

    if (!response.ok || !data.mission) {
      setError(data.error ?? "No se pudo crear la misión")
      setCreating(false)
      return
    }

    setMissions((current) => [data.mission!, ...current])
    setDrafts((current) => ({
      ...current,
      [data.mission!.id]: {
        title: data.mission!.title,
        description: data.mission!.description,
        points: String(data.mission!.points),
        active: data.mission!.active,
      },
    }))
    setNewMission(emptyDraft)
    void loadEvidences(selectedMissionId)
    setCreating(false)
    setSuccess("Misión creada")
  }

  async function saveMission(id: string) {
    const draft = drafts[id]
    if (!draft) return

    const validationError = validateMissionInput(draft)
    if (validationError) {
      setError(validationError)
      setSuccess(null)
      return
    }

    setSavingId(id)
    setError(null)
    setSuccess(null)

    const response = await fetch("/api/admin/missions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        points: Number(draft.points),
        active: draft.active,
      }),
    })

    const data = (await response.json()) as { mission?: AdminMission; error?: string }

    if (!response.ok || !data.mission) {
      setError(data.error ?? "No se pudo guardar la misión")
      setSavingId(null)
      return
    }

    setMissions((current) => current.map((mission) => (mission.id === id ? data.mission! : mission)))
    void loadEvidences(selectedMissionId)
    setSavingId(null)
    setSuccess("Cambios guardados")
  }

  function updateDraft(id: string, values: Partial<DraftMission>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        ...values,
      },
    }))
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    )
  }

  const createValidationError = validateMissionInput(newMission)

  if (forbidden) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este panel es solo para el usuario adminBoda. Inicia sesión con ese nombre para entrar.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Panel admin de misiones</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea, edita, bloquea y desbloquea misiones en tiempo real.
          </p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-3 text-sm text-primary">{success}</p>}
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Crear misión</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={newMission.title}
              onChange={(event) => setNewMission((current) => ({ ...current, title: event.target.value }))}
              placeholder="Título"
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
            <input
              value={newMission.points}
              onChange={(event) => setNewMission((current) => ({ ...current, points: event.target.value }))}
              type="number"
              min={1}
              placeholder="Puntos"
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
            <textarea
              value={newMission.description}
              onChange={(event) => setNewMission((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descripción"
              className="sm:col-span-2 min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={newMission.active}
                onChange={(event) => setNewMission((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4"
              />
              Misión activa
            </label>

            <button
              type="button"
              disabled={creating || Boolean(createValidationError)}
              onClick={() => void createMission()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              <PlusCircle className="h-4 w-4" />
              {creating ? "Creando..." : "Crear"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Galería de evidencias</h2>
            </div>

            <select
              value={selectedMissionId}
              onChange={(event) => setSelectedMissionId(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Todas las misiones</option>
              {evidenceMissions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </div>

          {evidenceLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : evidences.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Aún no hay fotos de evidencia para este filtro.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evidences.map((item, index) => (
                <article
                  key={`${item.guestId}-${item.missionId}-${item.completedAt}`}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  {item.evidenceImageData ? (
                    <button
                      type="button"
                      onClick={() => setSelectedEvidenceIndex(index)}
                      className="block w-full"
                    >
                      <img
                        src={item.evidenceImageData}
                        alt={`Evidencia de ${item.guestName}`}
                        className="h-44 w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-muted text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                  <div className="space-y-1 p-3">
                    <p className="text-sm font-semibold text-foreground">{item.guestName}</p>
                    <p className="text-xs text-muted-foreground">{item.missionTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.completedAt).toLocaleString("es-CL")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {sortedMissions.map((mission) => {
            const draft = drafts[mission.id]
            if (!draft) return null
            const saveValidationError = validateMissionInput(draft)

            return (
              <article key={mission.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft(mission.id, { title: event.target.value })}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                  <input
                    value={draft.points}
                    onChange={(event) => updateDraft(mission.id, { points: event.target.value })}
                    type="number"
                    min={1}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                  <textarea
                    value={draft.description}
                    onChange={(event) => updateDraft(mission.id, { description: event.target.value })}
                    className="sm:col-span-2 min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => updateDraft(mission.id, { active: !draft.active })}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    {draft.active ? <Unlock className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    {draft.active ? "Desbloqueada" : "Bloqueada"}
                  </button>

                  <button
                    type="button"
                    disabled={savingId === mission.id || Boolean(saveValidationError)}
                    onClick={() => void saveMission(mission.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {savingId === mission.id ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      </div>

      {selectedEvidence && selectedEvidence.evidenceImageData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4"
          onClick={() => setSelectedEvidenceIndex(null)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedEvidence.guestName}</p>
                <p className="text-xs text-muted-foreground">{selectedEvidence.missionTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvidenceIndex((current) => {
                      if (current === null || evidences.length === 0) return current
                      return current === 0 ? evidences.length - 1 : current - 1
                    })
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvidenceIndex((current) => {
                      if (current === null || evidences.length === 0) return current
                      return (current + 1) % evidences.length
                    })
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Siguiente →
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvidenceIndex(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="bg-background">
              <img
                src={selectedEvidence.evidenceImageData}
                alt={`Evidencia ampliada de ${selectedEvidence.guestName}`}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>

            <div className="border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {new Date(selectedEvidence.completedAt).toLocaleString("es-CL")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Usa ← y → para navegar, o Esc para cerrar.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
