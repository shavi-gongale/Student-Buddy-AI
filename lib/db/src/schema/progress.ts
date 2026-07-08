import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const progressTable = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  problemTitle: text("problem_title").notNull(),
  platform: text("platform").notNull(),
  difficulty: text("difficulty").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("solved"),
  language: text("language").notNull(),
  timeSpentMins: integer("time_spent_mins"),
  solvedAt: timestamp("solved_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProgressSchema = createInsertSchema(progressTable).omit({ id: true, createdAt: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progressTable.$inferSelect;
