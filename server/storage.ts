import { users, moods, chatMessages, calendarEvents, tasks, wellnessActivities, sleepData,
         type User, type InsertUser, type Mood, type InsertMood, 
         type ChatMessage, type InsertChatMessage, type CalendarEvent, type InsertCalendarEvent,
         type Task, type InsertTask, type WellnessActivity, type InsertWellnessActivity,
         type SleepData, type InsertSleepData } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Mood methods
  createMood(mood: InsertMood): Promise<Mood>;
  getUserMoods(userId: number, limit?: number): Promise<Mood[]>;
  
  // Chat methods
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  getUserChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  clearUserChatMessages(userId: number): Promise<void>;
  
  // Calendar methods
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  findCalendarEventByGoogleId(googleId: string): Promise<CalendarEvent | undefined>;
  upsertGoogleCalendarEvent(event: InsertCalendarEvent & { googleId: string }): Promise<CalendarEvent>;
  getUserGoogleCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  deleteGoogleCalendarEventByGoogleId(googleId: string): Promise<boolean>;
  
  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getUserTasks(userId: number): Promise<Task[]>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Wellness methods
  createWellnessActivity(activity: InsertWellnessActivity): Promise<WellnessActivity>;
  getUserWellnessActivities(userId: number, limit?: number): Promise<WellnessActivity[]>;
  
  // Sleep data methods
  createSleepData(sleepData: InsertSleepData): Promise<SleepData>;
  getUserSleepData(userId: number, date: string): Promise<SleepData | undefined>;
  getUserRecentSleepData(userId: number, days?: number): Promise<SleepData[]>;
  updateSleepData(userId: number, date: string, sleepData: Partial<InsertSleepData>): Promise<SleepData | undefined>;
}

// rewrite MemStorage to DatabaseStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createMood(insertMood: InsertMood): Promise<Mood> {
    const [mood] = await db
      .insert(moods)
      .values(insertMood)
      .returning();
    return mood;
  }

  async getUserMoods(userId: number, limit: number = 10): Promise<Mood[]> {
    return await db
      .select()
      .from(moods)
      .where(eq(moods.userId, userId))
      .orderBy(desc(moods.timestamp))
      .limit(limit);
  }

  async createChatMessage(insertChatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(insertChatMessage)
      .returning();
    return chatMessage;
  }

  async getUserChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.timestamp)
      .limit(limit);
  }

  async clearUserChatMessages(userId: number): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.userId, userId));
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getUserCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            gte(calendarEvents.startTime, startDate),
            lte(calendarEvents.startTime, endDate)
          )
        )
        .orderBy(calendarEvents.startTime);
    }

    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .orderBy(calendarEvents.startTime);
  }

  async updateCalendarEvent(id: number, updateEvent: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .update(calendarEvents)
      .set(updateEvent)
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updateTask)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createWellnessActivity(insertActivity: InsertWellnessActivity): Promise<WellnessActivity> {
    const [activity] = await db
      .insert(wellnessActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getUserWellnessActivities(userId: number, limit: number = 20): Promise<WellnessActivity[]> {
    return await db
      .select()
      .from(wellnessActivities)
      .where(eq(wellnessActivities.userId, userId))
      .orderBy(desc(wellnessActivities.timestamp))
      .limit(limit);
  }

  async findCalendarEventByGoogleId(googleId: string): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.googleId, googleId));
    return event || undefined;
  }

  async upsertGoogleCalendarEvent(event: InsertCalendarEvent & { googleId: string }): Promise<CalendarEvent> {
    // First try to find existing event
    const existingEvent = await this.findCalendarEventByGoogleId(event.googleId);
    
    if (existingEvent) {
      // Update existing event
      const [updatedEvent] = await db
        .update(calendarEvents)
        .set({
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          type: event.type,
          googleId: event.googleId
        })
        .where(eq(calendarEvents.id, existingEvent.id))
        .returning();
      return updatedEvent;
    } else {
      // Create new event
      const [newEvent] = await db
        .insert(calendarEvents)
        .values(event)
        .returning();
      return newEvent;
    }
  }

  async getUserGoogleCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.type, 'google-calendar')
        )
      );
  }

  async deleteGoogleCalendarEventByGoogleId(googleId: string): Promise<boolean> {
    const result = await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.googleId, googleId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createSleepData(insertSleepData: InsertSleepData): Promise<SleepData> {
    const [sleep] = await db
      .insert(sleepData)
      .values(insertSleepData)
      .returning();
    return sleep;
  }

  async getUserSleepData(userId: number, date: string): Promise<SleepData | undefined> {
    const [sleep] = await db
      .select()
      .from(sleepData)
      .where(and(eq(sleepData.userId, userId), eq(sleepData.date, date)));
    return sleep || undefined;
  }

  async getUserRecentSleepData(userId: number, days: number = 7): Promise<SleepData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db
      .select()
      .from(sleepData)
      .where(and(
        eq(sleepData.userId, userId),
        gte(sleepData.date, startDate.toISOString().split('T')[0])
      ))
      .orderBy(desc(sleepData.date));
  }

  async updateSleepData(userId: number, date: string, updateSleepData: Partial<InsertSleepData>): Promise<SleepData | undefined> {
    const [sleep] = await db
      .update(sleepData)
      .set(updateSleepData)
      .where(and(eq(sleepData.userId, userId), eq(sleepData.date, date)))
      .returning();
    return sleep || undefined;
  }
}

export const storage = new DatabaseStorage();
