export type MissionStatus = "locked" | "available" | "completed"

export interface Mission {
  id: string
  title: string
  description: string
  points: number
  status: MissionStatus
  icon: string
}

export interface Guest {
  id: string
  name: string
  points: number
  avatar?: string
}

export interface FeedItem {
  id: string
  guestName: string
  missionTitle: string
  points: number
  timestamp: string
}

export const missions: Mission[] = [
  {
    id: "1",
    title: "Selfie con los novios",
    description: "Tomate una selfie con la pareja y comparte el momento.",
    points: 20,
    status: "available",
    icon: "camera",
  },
  {
    id: "2",
    title: "Primer baile",
    description: "Graba un video del primer baile de los novios.",
    points: 15,
    status: "available",
    icon: "music",
  },
  {
    id: "3",
    title: "Mensaje en el libro",
    description: "Deja un mensaje especial en el libro de invitados.",
    points: 10,
    status: "completed",
    icon: "book",
  },
  {
    id: "4",
    title: "Foto grupal",
    description: "Participa en la foto grupal con todos los invitados.",
    points: 25,
    status: "available",
    icon: "users",
  },
  {
    id: "5",
    title: "Brindis especial",
    description: "Haz un brindis dedicado a los novios.",
    points: 30,
    status: "locked",
    icon: "wine",
  },
  {
    id: "6",
    title: "Ramo de la novia",
    description: "Participa en el lanzamiento del ramo.",
    points: 20,
    status: "locked",
    icon: "flower",
  },
  {
    id: "7",
    title: "Pista de baile",
    description: "Se el primero en abrir la pista de baile.",
    points: 15,
    status: "available",
    icon: "sparkles",
  },
  {
    id: "8",
    title: "Historia de amor",
    description: "Cuenta como conociste a los novios en una historia breve.",
    points: 20,
    status: "available",
    icon: "heart",
  },
]

export const leaderboard: Guest[] = [
  { id: "1", name: "Camila Rodriguez", points: 120 },
  { id: "2", name: "Santiago Morales", points: 95 },
  { id: "3", name: "Valentina Lopez", points: 85 },
  { id: "4", name: "Mateo Garcia", points: 70 },
  { id: "5", name: "Isabella Torres", points: 55 },
  { id: "6", name: "Sebastian Ruiz", points: 45 },
  { id: "7", name: "Lucia Fernandez", points: 35 },
  { id: "8", name: "Nicolas Herrera", points: 25 },
]

export const feedItems: FeedItem[] = [
  {
    id: "1",
    guestName: "Camila Rodriguez",
    missionTitle: "Selfie con los novios",
    points: 20,
    timestamp: "Hace 2 min",
  },
  {
    id: "2",
    guestName: "Santiago Morales",
    missionTitle: "Mensaje en el libro",
    points: 10,
    timestamp: "Hace 5 min",
  },
  {
    id: "3",
    guestName: "Valentina Lopez",
    missionTitle: "Primer baile",
    points: 15,
    timestamp: "Hace 8 min",
  },
  {
    id: "4",
    guestName: "Mateo Garcia",
    missionTitle: "Foto grupal",
    points: 25,
    timestamp: "Hace 12 min",
  },
  {
    id: "5",
    guestName: "Isabella Torres",
    missionTitle: "Historia de amor",
    points: 20,
    timestamp: "Hace 15 min",
  },
  {
    id: "6",
    guestName: "Sebastian Ruiz",
    missionTitle: "Pista de baile",
    points: 15,
    timestamp: "Hace 20 min",
  },
  {
    id: "7",
    guestName: "Lucia Fernandez",
    missionTitle: "Selfie con los novios",
    points: 20,
    timestamp: "Hace 25 min",
  },
  {
    id: "8",
    guestName: "Nicolas Herrera",
    missionTitle: "Brindis especial",
    points: 30,
    timestamp: "Hace 30 min",
  },
]
