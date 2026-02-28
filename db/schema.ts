import { pgTable, text, boolean, integer, timestamp, primaryKey } from "drizzle-orm/pg-core"

export const guests = pgTable("guests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  displayName: text("display_name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
})

export const missions = pgTable("missions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  active: boolean("active").notNull().default(true),
})

export const guestMissions = pgTable(
  "guest_missions",
  {
    guestId: text("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    missionId: text("mission_id")
      .notNull()
      .references(() => missions.id, { onDelete: "cascade" }),
    evidenceImageData: text("evidence_image_data"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guestId, table.missionId] }),
  })
)
