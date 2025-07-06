import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: text("mood").notNull(), // 😊, 😐, 😔, 😰, 😌
  context: text("context"), // JSON string for additional data like sleep, weather
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type").default("event"), // event, wellness, break
  googleId: text("google_id"), // For tracking Google Calendar events
  movabilityStatus: text("movability_status").default("unsure"), // "fixed", "movable", "unsure"
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull(), // high, medium, low
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wellnessActivities = pgTable("wellness_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // breathing, affirmation, meditation
  duration: integer("duration"), // in seconds
  completed: boolean("completed").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const sleepData = pgTable("sleep_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  sleepQuality: text("sleep_quality").notNull(), // "excellent", "good", "fair", "poor"
  sleepHours: integer("sleep_hours").notNull(), // Convert to minutes for storage
  wakeUpTime: text("wake_up_time"), // HH:MM format
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertMoodSchema = createInsertSchema(moods).omit({ id: true, timestamp: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertWellnessActivitySchema = createInsertSchema(wellnessActivities).omit({ id: true, timestamp: true });
export const insertSleepDataSchema = createInsertSchema(sleepData).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Mood = typeof moods.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type WellnessActivity = typeof wellnessActivities.$inferSelect;
export type InsertWellnessActivity = z.infer<typeof insertWellnessActivitySchema>;
export type SleepData = typeof sleepData.$inferSelect;
export type InsertSleepData = z.infer<typeof insertSleepDataSchema>;
