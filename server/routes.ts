import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChatResponse, generateSwotAnalysis, getAnxietySupport, generateDailyPlan, planDay, generateAffirmation } from "./services/groq";
import { syncGoogleCalendarEvents, isGoogleCalendarConfigured, getAuthorizationUrl, exchangeCodeForTokens } from "./services/googleCalendar";
import { insertMoodSchema, insertChatMessageSchema, insertCalendarEventSchema, insertTaskSchema, insertWellnessActivitySchema } from "@shared/schema";
import type { CalendarEvent } from "@shared/schema";
import fetch from "node-fetch";
import { eq } from "drizzle-orm";
import { moods } from "@shared/schema";
import { db } from "./db";

// Enhanced message context function for proactive daily companion
async function enhanceMessageWithContext(message: string, userId: number): Promise<string> {
  try {
    // Get comprehensive user data
    const today = new Date().toISOString().split('T')[0];
    const [moodData, sleepData, calendarEvents] = await Promise.all([
      storage.getUserMoods(userId, 10), // Get more mood history for patterns
      storage.getUserSleepData(userId, today),
      storage.getUserCalendarEvents(userId),
    ]);

    // Get today's events
    const todayEvents = calendarEvents.filter((event: CalendarEvent) => 
      new Date(event.startTime).toISOString().split('T')[0] === today
    );

    // Get upcoming events (next 4 hours)
    const now = new Date();
    const upcomingEvents = calendarEvents.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.startTime);
      const timeDiff = eventStart.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 4 * 60 * 60 * 1000; // Next 4 hours
    });

    // Analyze movable vs fixed tasks
    const movableEvents = todayEvents.filter((event: CalendarEvent) => 
      event.movabilityStatus === 'movable'
    );
    const fixedEvents = todayEvents.filter((event: CalendarEvent) => 
      event.movabilityStatus !== 'movable'
    );

    // ENHANCED EMOTION CHANGE DETECTION
    let emotionAnalysis = '';
    let calendarSuggestions = '';
    
    if (moodData.length > 0) {
      const latestMood = moodData[0];
      const moodTime = new Date(latestMood.timestamp);
      const hoursSinceLastMood = (now.getTime() - moodTime.getTime()) / (1000 * 60 * 60);
      
      // Detect mood changes and patterns
      if (moodData.length > 1) {
        const previousMood = moodData[1];
        const recentMoods = moodData.slice(0, 3);
        
        // Check for negative mood changes
        const stressEmojis = ['😰', '😟', '😥', '😓', '😔', '😞', '😩', '😫', '😖', '😤'];
        const positiveEmojis = ['😊', '😄', '😃', '😁', '🙂', '😌', '😎', '🤗', '😍', '🥰'];
        
        const isCurrentlyStressed = stressEmojis.includes(latestMood.mood);
        const wasPositive = positiveEmojis.includes(previousMood.mood);
        const recentlyChanged = hoursSinceLastMood < 2;
        
        if (isCurrentlyStressed && recentlyChanged) {
          emotionAnalysis = `🚨 EMOTION ALERT: Recent mood change to ${latestMood.mood} (${Math.round(hoursSinceLastMood)}h ago)`;
          
          // Provide calendar optimization suggestions for stressed state
          if (movableEvents.length > 0) {
            calendarSuggestions = `\n📅 SUGGESTED CALENDAR OPTIMIZATIONS FOR CURRENT MOOD:
- Consider moving "${movableEvents[0].title}" to later when energy might be higher
- Create 15-minute buffer zones before demanding tasks
- Prioritize most important movable tasks for your peak energy hours`;
          }
        }
        
        // Detect positive mood opportunities
        if (positiveEmojis.includes(latestMood.mood) && recentlyChanged) {
          emotionAnalysis = `✨ POSITIVE MOOD OPPORTUNITY: Feeling ${latestMood.mood} - great time for challenging tasks!`;
          
          if (movableEvents.length > 0) {
            calendarSuggestions = `\n🚀 SUGGESTED CALENDAR OPTIMIZATIONS FOR POSITIVE MOOD:
- Perfect time to tackle "${movableEvents[0].title}" if it's challenging
- Consider moving demanding tasks to now while energy is high
- Use this positive momentum for important conversations or decisions`;
          }
        }
      }
    }

    // ENHANCED CALENDAR CONFLICT DETECTION
    const conflictAnalysis = analyzeDayStructure(todayEvents, sleepData);
    
    // Format enhanced context information
    let contextInfo = `\n\n=== DAILY COMPANION CONTEXT ===\n`;
    
    // Time context
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';
    contextInfo += `Current time: ${currentTime} on ${currentDate} (${timeOfDay})\n`;

    // Enhanced mood context with emotion analysis
    if (moodData.length > 0) {
      const latestMood = moodData[0];
      const moodTime = new Date(latestMood.timestamp);
      const hoursSinceLastMood = (now.getTime() - moodTime.getTime()) / (1000 * 60 * 60);
      
      contextInfo += `\nRecent mood: ${latestMood.mood} (${Math.round(hoursSinceLastMood)}h ago)\n`;
      
      // Mood pattern analysis
      if (moodData.length > 1) {
        const recentMoods = moodData.slice(0, 3);
        const moodTrend = recentMoods.map(m => m.mood).join(' → ');
        contextInfo += `Recent mood trend: ${moodTrend}\n`;
      }
      
      // Include emotion analysis
      if (emotionAnalysis) {
        contextInfo += `${emotionAnalysis}\n`;
      }
    }

    // Enhanced sleep context with specific recommendations
    if (sleepData) {
      contextInfo += `\nSleep last night: ${sleepData.sleepHours} hours of ${sleepData.sleepQuality} quality`;
      if (sleepData.wakeUpTime) {
        contextInfo += ` (woke up at ${sleepData.wakeUpTime})`;
      }
      contextInfo += `\n`;
      
      // Energy level implications with specific timing advice
      const energyLevel = sleepData.sleepQuality === 'excellent' && sleepData.sleepHours >= 7 ? 'high' :
                         sleepData.sleepQuality === 'good' && sleepData.sleepHours >= 6 ? 'moderate' :
                         sleepData.sleepQuality === 'poor' || sleepData.sleepHours < 6 ? 'low' : 'moderate';
      
      contextInfo += `Expected energy level: ${energyLevel}`;
      
      // Add timing recommendations based on sleep
      if (energyLevel === 'low') {
        contextInfo += ` - Recommend scheduling demanding tasks for 10-11am or 2-3pm\n`;
      } else if (energyLevel === 'high') {
        contextInfo += ` - Great time for challenging tasks throughout the day\n`;
      } else {
        contextInfo += ` - Best energy likely in morning and early afternoon\n`;
      }
    }

    // Enhanced calendar structure analysis
    contextInfo += `\nToday's Schedule Structure:\n`;
    contextInfo += `- Total events: ${todayEvents.length}\n`;
    contextInfo += `- Fixed commitments: ${fixedEvents.length}\n`;
    contextInfo += `- Flexible tasks: ${movableEvents.length}\n`;

    // Include calendar optimization suggestions
    if (calendarSuggestions) {
      contextInfo += calendarSuggestions;
    }

    // Enhanced conflict and optimization analysis
    if (conflictAnalysis) {
      contextInfo += `\n${conflictAnalysis}`;
    }

    // Detailed event context with movability clearly marked
    if (todayEvents.length > 0) {
      contextInfo += `\nToday's Events (in order):\n`;
      const sortedEvents = todayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      sortedEvents.forEach((event: CalendarEvent, index) => {
        const startTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const flexibility = event.movabilityStatus === 'movable' ? 'MOVABLE ✅' : 'FIXED 🔒';
        contextInfo += `${index + 1}. ${startTime}-${endTime}: "${event.title}" [${flexibility}]`;
        if (event.description) {
          contextInfo += ` - ${event.description.substring(0, 50)}...`;
        }
        contextInfo += `\n`;
      });
    }

    // Enhanced upcoming events with urgency
    if (upcomingEvents.length > 0) {
      contextInfo += `\nUpcoming Events (next 4 hours):\n`;
      upcomingEvents.forEach((event: CalendarEvent) => {
        const startTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const minutesUntil = Math.round((new Date(event.startTime).getTime() - now.getTime()) / (1000 * 60));
        const urgency = minutesUntil < 30 ? '🚨' : minutesUntil < 60 ? '⚠️' : '📅';
        contextInfo += `${urgency} "${event.title}" in ${minutesUntil} minutes (${startTime})`;
        if (event.description) {
          contextInfo += ` - ${event.description.substring(0, 50)}...`;
        }
        contextInfo += `\n`;
      });
    }

    contextInfo += `=== END CONTEXT ===\n\n`;

    // Enhanced message with more specific instructions
    const enhancedMessage = `${contextInfo}User message: "${message}"

DAILY COMPANION INSTRUCTIONS:
🎯 Your primary goal is to help them structure their day optimally based on their current emotional and physical state.

💡 IMMEDIATE PRIORITIES (check context for alerts):
1. If there's an EMOTION ALERT, prioritize stress management and calendar optimization
2. If there's a POSITIVE MOOD OPPORTUNITY, suggest leveraging this energy for important tasks
3. If there are upcoming urgent events (🚨⚠️), help them prepare or create buffer time
4. If they have poor sleep/low energy, recommend energy-appropriate task timing

📋 SPECIFIC CALENDAR MANAGEMENT ACTIONS:
- Always reference specific event names and times when giving advice
- Proactively suggest moving MOVABLE ✅ events to optimize their day
- Protect FIXED 🔒 events but suggest preparation strategies
- Consider their sleep quality and current mood when suggesting optimal timing
- Create realistic buffer time between demanding tasks

🗣️ COMMUNICATION REQUIREMENTS:
- Maximum 2-3 sentences or 4-5 bullet points (never exceed 150 words)
- Use emojis sparingly (1-2 per response)
- Always include ONE specific actionable suggestion
- Reference actual event names and times when relevant
- End with a question or next step

🔄 BE PROACTIVE:
- Notice patterns in their schedule/mood that need attention
- Suggest specific time slots for moving tasks (not just "later")
- Help them prepare for upcoming events
- Be their gentle accountability partner

Remember: You're their friend who's excellent at day planning. Be natural, caring, and focus on making their day flow smoothly with specific, actionable advice based on their current state.`;

    return enhancedMessage;
  } catch (error) {
    console.error("Context enhancement error:", error);
    return `User message: "${message}"

I'm having trouble accessing some of your context right now, but I'm still here to help you structure your day! What's on your mind? 💙`;
  }
}

// Helper function to analyze busy periods
function analyzeBusyPeriods(events: CalendarEvent[]): string[] {
  const periods = [];
  const sortedEvents = events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Check for back-to-back events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = new Date(sortedEvents[i].endTime);
    const nextStart = new Date(sortedEvents[i + 1].startTime);
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
    
    if (gapMinutes <= 15) {
      periods.push(`back-to-back events (${sortedEvents[i].title} → ${sortedEvents[i + 1].title})`);
    }
  }
  
  // Check for high-density periods (3+ events in 4 hours)
  const fourHourWindows = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const windowStart = new Date(sortedEvents[i].startTime);
    const windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
    
    const eventsInWindow = sortedEvents.filter(event => 
      new Date(event.startTime) >= windowStart && new Date(event.startTime) <= windowEnd
    );
    
    if (eventsInWindow.length >= 3) {
      const startTime = windowStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      periods.push(`busy period starting ${startTime} (${eventsInWindow.length} events)`);
    }
  }
  
  return Array.from(new Set(periods)); // Remove duplicates
}

// Helper function to analyze day structure for conflicts and suggestions
function analyzeDayStructure(events: CalendarEvent[], sleepData: any): string {
  const now = new Date();
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter((event: CalendarEvent) => 
    new Date(event.startTime).toISOString().split('T')[0] === today
  );

  const movableEvents = todayEvents.filter((event: CalendarEvent) => 
    event.movabilityStatus === 'movable'
  );
  const fixedEvents = todayEvents.filter((event: CalendarEvent) => 
    event.movabilityStatus !== 'movable'
  );

  const conflictAnalysis = [];
  const suggestions = [];

  // Check for back-to-back events
  for (let i = 0; i < todayEvents.length - 1; i++) {
    const currentEnd = new Date(todayEvents[i].endTime);
    const nextStart = new Date(todayEvents[i + 1].startTime);
    const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
    
    if (gapMinutes <= 15) {
      conflictAnalysis.push(`⚠️ Conflict: "${todayEvents[i].title}" ends at ${currentEnd.toLocaleTimeString()} and "${todayEvents[i + 1].title}" starts at ${nextStart.toLocaleTimeString()}. Consider a buffer.`);
    }
  }

  // Check for high-density periods (3+ events in 4 hours)
  const fourHourWindows = [];
  for (let i = 0; i < todayEvents.length; i++) {
    const windowStart = new Date(todayEvents[i].startTime);
    const windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
    
    const eventsInWindow = todayEvents.filter(event => 
      new Date(event.startTime) >= windowStart && new Date(event.startTime) <= windowEnd
    );
    
    if (eventsInWindow.length >= 3) {
      fourHourWindows.push(`⚠️ High Density: ${eventsInWindow.length} events from ${windowStart.toLocaleTimeString()} to ${windowEnd.toLocaleTimeString()}. Consider breaks.`);
    }
  }

  // Check for overlapping events
  for (let i = 0; i < todayEvents.length; i++) {
    for (let j = i + 1; j < todayEvents.length; j++) {
      const event1 = todayEvents[i];
      const event2 = todayEvents[j];

      if (new Date(event1.startTime) < new Date(event2.endTime) && new Date(event1.endTime) > new Date(event2.startTime)) {
        conflictAnalysis.push(`⚠️ Conflict: "${event1.title}" from ${new Date(event1.startTime).toLocaleTimeString()} to ${new Date(event1.endTime).toLocaleTimeString()} overlaps with "${event2.title}" from ${new Date(event2.startTime).toLocaleTimeString()} to ${new Date(event2.endTime).toLocaleTimeString()}.`);
      }
    }
  }

  // Suggestions for calendar optimization
  if (movableEvents.length > 0) {
    suggestions.push(`🚀 SUGGESTION: Consider moving "${movableEvents[0].title}" to a time when energy is high or when it's not directly in a busy period.`);
  }
  if (fixedEvents.length > 0) {
    suggestions.push(`🔒 SUGGESTION: Protect your FIXED 🔒 commitments. Ensure they are scheduled at a time when you can fully focus.`);
  }
  if (sleepData && sleepData.sleepHours < 7) {
    suggestions.push(`💤 SUGGESTION: Given your poor sleep last night, it's recommended to schedule demanding tasks for times when energy is naturally high (e.g., 10-11am, 2-3pm).`);
  }

  const allAnalysis = [...conflictAnalysis, ...fourHourWindows, ...suggestions];
  return allAnalysis.length > 0 ? allAnalysis.join('\n') : '';
}

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 1; // Using default user for demo

  // Chat endpoint with enhanced context
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Enhanced message with comprehensive context
      const enhancedMessage = await enhanceMessageWithContext(message, DEFAULT_USER_ID);
      
      const response = await getChatResponse(enhancedMessage);
      
      // Store the original message and response
      await storage.createChatMessage({
        userId: DEFAULT_USER_ID,
        message: message,
        response: response,
      });

      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/history", async (req, res) => {
    try {
      const messages = await storage.getUserChatMessages(DEFAULT_USER_ID);
      res.json(messages);
    } catch (error) {
      console.error("Chat history error:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  app.post("/api/chat/reset", async (req, res) => {
    try {
      await storage.clearUserChatMessages(DEFAULT_USER_ID);
      res.json({ success: true, message: "Chat history reset successfully" });
    } catch (error) {
      console.error("Chat reset error:", error);
      res.status(500).json({ error: "Failed to reset chat history" });
    }
  });

  // Mood endpoints
  app.post("/api/mood", async (req, res) => {
    try {
      const moodData = insertMoodSchema.parse({ ...req.body, userId: DEFAULT_USER_ID });
      const mood = await storage.createMood(moodData);
      res.json(mood);
    } catch (error) {
      console.error("Mood creation error:", error);
      res.status(400).json({ error: "Invalid mood data" });
    }
  });

  app.get("/api/mood", async (req, res) => {
    try {
      // Get limit from query parameter, default to 1000 for statistics
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 1000;
      const moods = await storage.getUserMoods(DEFAULT_USER_ID, limit);
      res.json(moods);
    } catch (error) {
      console.error("Mood fetch error:", error);
      res.status(500).json({ error: "Failed to fetch moods" });
    }
  });

  // Delete all mood entries (analytics reset)
  app.delete("/api/mood/reset", async (req, res) => {
    try {
      const userId = 1; // For now, we use a fixed user ID
      await db.delete(moods).where(eq(moods.userId, userId));
      res.json({ message: "Analytics data reset successfully" });
    } catch (error) {
      console.error("Error resetting analytics:", error);
      res.status(500).json({ error: "Failed to reset analytics data" });
    }
  });

  // Calendar endpoints
  app.post("/api/calendar/events", async (req, res) => {
    try {
      const eventData = insertCalendarEventSchema.parse({ ...req.body, userId: DEFAULT_USER_ID });
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.get("/api/calendar/events", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const events = await storage.getUserCalendarEvents(DEFAULT_USER_ID, start, end);
      res.json(events);
    } catch (error) {
      console.error("Events fetch error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/calendar/events/today", async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const events = await storage.getUserCalendarEvents(DEFAULT_USER_ID, startOfDay, endOfDay);
      res.json(events);
    } catch (error) {
      console.error("Today events fetch error:", error);
      res.status(500).json({ error: "Failed to fetch today's events" });
    }
  });

  app.put("/api/calendar/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const event = await storage.updateCalendarEvent(id, updateData);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.patch("/api/calendar/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const event = await storage.updateCalendarEvent(id, updateData);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Event update error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/calendar/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCalendarEvent(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Event deletion error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Task endpoints
  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse({ ...req.body, userId: DEFAULT_USER_ID });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getUserTasks(DEFAULT_USER_ID);
      res.json(tasks);
    } catch (error) {
      console.error("Tasks fetch error:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const task = await storage.updateTask(id, updateData);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Task update error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Task deletion error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Wellness endpoints
  app.post("/api/wellness/activities", async (req, res) => {
    try {
      const activityData = insertWellnessActivitySchema.parse({ ...req.body, userId: DEFAULT_USER_ID });
      const activity = await storage.createWellnessActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error("Wellness activity error:", error);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.get("/api/wellness/activities", async (req, res) => {
    try {
      const activities = await storage.getUserWellnessActivities(DEFAULT_USER_ID);
      res.json(activities);
    } catch (error) {
      console.error("Wellness activities fetch error:", error);
      res.status(500).json({ error: "Failed to fetch wellness activities" });
    }
  });

  // AI-powered endpoints
  app.post("/api/ai/plan", async (req, res) => {
    try {
      const { userInput } = req.body;
      if (!userInput) {
        return res.status(400).json({ error: "User input is required" });
      }

      // Get today's calendar events for context
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const calendarEvents = await storage.getUserCalendarEvents(DEFAULT_USER_ID, startOfDay, endOfDay);

      const plan = await generateDailyPlan(userInput, calendarEvents);
      res.json(plan);
    } catch (error) {
      console.error("AI planning error:", error);
      res.status(500).json({ error: "Failed to generate plan" });
    }
  });

  app.post("/api/ai/anxiety-support", async (req, res) => {
    try {
      const { situation } = req.body;
      if (!situation) {
        return res.status(400).json({ error: "Situation description is required" });
      }

      const support = await getAnxietySupport(situation);
      res.json(support);
    } catch (error) {
      console.error("AI anxiety support error:", error);
      res.status(500).json({ error: "Failed to get anxiety support" });
    }
  });

  app.get("/api/ai/affirmation", async (req, res) => {
    try {
      const { mood } = req.query;
      const affirmation = await generateAffirmation(mood as string);
      res.json({ affirmation });
    } catch (error) {
      console.error("AI affirmation error:", error);
      res.status(500).json({ error: "Failed to generate affirmation" });
    }
  });

  app.post("/api/ai/swot-analysis", async (req, res) => {
    try {
      const { situation } = req.body;
      if (!situation) {
        return res.status(400).json({ error: "Situation description is required" });
      }

      // Get upcoming calendar events for context
      const today = new Date();
      const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const calendarEvents = await storage.getUserCalendarEvents(DEFAULT_USER_ID, today, oneWeekFromNow);

      const analysis = await generateSwotAnalysis(situation, calendarEvents);
      res.json(analysis);
    } catch (error) {
      console.error("AI SWOT analysis error:", error);
      res.status(500).json({ error: "Failed to generate SWOT analysis" });
    }
  });

  // Weather endpoint for Washington DC
  app.get("/api/weather", async (req, res) => {
    try {
      // Washington DC coordinates
      const lat = 38.9072; // Washington DC latitude
      const lon = -77.0369; // Washington DC longitude

      // Fetch weather data from Open-Meteo API (free, no API key required)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FNew_York&forecast_days=3`
      );
      
      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.status}`);
      }
      
      const weatherData = await weatherRes.json() as {
        current: {
          weather_code: number;
          temperature_2m: number;
          relative_humidity_2m: number;
          wind_speed_10m: number;
        };
        daily: {
          weather_code: number[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          time: string[];
        };
      };
      
      // Get weather description from weather code
      const getWeatherDescription = (code: number): string => {
        if (code === 0) return "Clear sky";
        if (code <= 3) return "Partly cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 67) return "Rainy";
        if (code <= 77) return "Snowy";
        if (code <= 82) return "Showers";
        if (code <= 99) return "Thunderstorms";
        return "Clear";
      };

      // Format response to match expected WeatherData interface
      const weatherResponse = {
        current: {
          temperature: Math.round(weatherData.current.temperature_2m),
          description: getWeatherDescription(weatherData.current.weather_code),
          humidity: weatherData.current.relative_humidity_2m,
          windSpeed: weatherData.current.wind_speed_10m
        },
        forecast: weatherData.daily.time.slice(0, 3).map((date, index) => ({
          date,
          temperature: Math.round(weatherData.daily.temperature_2m_max[index]),
          description: getWeatherDescription(weatherData.daily.weather_code[index])
        }))
      };

      res.json(weatherResponse);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Weather and Sleep Evaluation endpoint
  app.post("/api/morning-evaluation", async (req, res) => {
    try {
      const { lat, lon, sleepQuality, sleepHours, wakeUpTime } = req.body;

      if (!lat || !lon || !sleepQuality) {
        return res.status(400).json({ error: "Latitude, longitude, and sleep quality are required" });
      }

      // Fetch weather data from Open-Meteo API (free, no API key required)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
      );
      
      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.status}`);
      }
      
      const weatherData = await weatherRes.json() as {
        current: {
          weather_code: number;
          temperature_2m: number;
          relative_humidity_2m: number;
          wind_speed_10m: number;
        };
      };
      
      // Get weather description from weather code
      const getWeatherDescription = (code: number): string => {
        if (code === 0) return "Clear sky";
        if (code <= 3) return "Partly cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 67) return "Rainy";
        if (code <= 77) return "Snowy";
        if (code <= 82) return "Showers";
        if (code <= 99) return "Thunderstorms";
        return "Unknown";
      };

      const weatherSummary = {
        description: getWeatherDescription(weatherData.current.weather_code),
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        code: weatherData.current.weather_code
      };

      // Store morning evaluation as a mood entry with additional context
      const morningMood = await storage.createMood({
        userId: DEFAULT_USER_ID,
        mood: "🌅", // Morning evaluation emoji
        context: JSON.stringify({
          type: "morning_evaluation",
          sleepQuality,
          sleepHours,
          wakeUpTime,
          weather: weatherSummary
        })
      });

      res.json({
        success: true,
        sleepQuality,
        sleepHours,
        wakeUpTime,
        weather: weatherSummary,
        evaluationId: morningMood.id
      });
    } catch (error) {
      console.error("Morning evaluation error:", error);
      res.status(500).json({ error: "Failed to process morning evaluation" });
    }
  });

  // Plan Day endpoint with Groq
  app.post("/api/plan-day", async (req, res) => {
    try {
      const { emotion, sleepQuality, weather, events } = req.body;

      if (!emotion || !sleepQuality || !weather) {
        return res.status(400).json({ error: "Emotion, sleep quality, and weather are required" });
      }

      const plan = await planDay(emotion, sleepQuality, weather, events);
      res.json(plan);
    } catch (error) {
      console.error("Plan day error:", error);
      res.status(500).json({ error: "Failed to generate daily plan" });
    }
  });

  // Google Calendar integration endpoints
  app.get("/api/google-calendar/status", async (req, res) => {
    try {
      const configured = await isGoogleCalendarConfigured();
      res.json({ configured });
    } catch (error) {
      console.error("Google Calendar status error:", error);
      res.status(500).json({ error: "Failed to check Google Calendar status" });
    }
  });

  app.get("/api/google-calendar/auth-url", async (req, res) => {
    try {
      const authUrl = await getAuthorizationUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Google Calendar auth URL error:", error);
      res.status(500).json({ error: "Failed to get authorization URL" });
    }
  });

  app.post("/api/google-calendar/authorize", async (req, res) => {
    try {
      const { authCode } = req.body;
      if (!authCode) {
        return res.status(400).json({ error: "Authorization code required" });
      }
      
      const tokens = await exchangeCodeForTokens(authCode);
      res.json({ success: true, tokens });
    } catch (error) {
      console.error("Google Calendar authorization error:", error);
      res.status(500).json({ error: "Failed to process authorization" });
    }
  });

  app.post("/api/google-calendar/sync", async (req, res) => {
    try {
      const { timeMin, timeMax } = req.body;
      const startDate = timeMin ? new Date(timeMin) : undefined;
      const endDate = timeMax ? new Date(timeMax) : undefined;
      
      const googleEvents = await syncGoogleCalendarEvents(startDate, endDate);
      
      // Get existing Google Calendar events from database
      const existingEvents = await storage.getUserGoogleCalendarEvents(DEFAULT_USER_ID);
      
      // Sync each Google Calendar event to database
      let syncedCount = 0;
      for (const event of googleEvents) {
        try {
          const savedEvent = await storage.upsertGoogleCalendarEvent({
            userId: DEFAULT_USER_ID,
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            type: event.type,
            googleId: event.googleId
          });
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync event: ${event.title}`, error);
        }
      }

      const responseMessage = syncedCount > 0 
        ? `Synced ${syncedCount} events`
        : `No new events to sync`;
      
      console.log(responseMessage);

      res.json({ 
        synced: syncedCount, 
        total: googleEvents.length,
        events: googleEvents,
        message: responseMessage
      });
    } catch (error) {
      console.error("Google Calendar sync error:", error);
      res.status(500).json({ error: "Failed to sync Google Calendar events" });
    }
  });

  // Sleep data routes
  app.post("/api/sleep", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;

      const { date, sleepQuality, sleepHours, wakeUpTime, notes } = req.body;
      
      // Check if sleep data already exists for this date
      const existingData = await storage.getUserSleepData(userId, date);
      
      if (existingData) {
        // Update existing sleep data
        const updated = await storage.updateSleepData(userId, date, {
          sleepQuality,
          sleepHours,
          wakeUpTime,
          notes
        });
        res.json(updated);
      } else {
        // Create new sleep data
        const sleepData = await storage.createSleepData({
          userId,
          date,
          sleepQuality,
          sleepHours,
          wakeUpTime,
          notes
        });
        res.json(sleepData);
      }
    } catch (error) {
      console.error("Error saving sleep data:", error);
      res.status(500).json({ error: "Failed to save sleep data" });
    }
  });

  app.get("/api/sleep/today", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;

      const today = new Date().toISOString().split('T')[0];
      const sleepData = await storage.getUserSleepData(userId, today);
      
      res.json(sleepData || null);
    } catch (error) {
      console.error("Error fetching today's sleep data:", error);
      res.status(500).json({ error: "Failed to fetch sleep data" });
    }
  });

  app.get("/api/sleep/recent", async (req, res) => {
    try {
      const userId = DEFAULT_USER_ID;

      const days = parseInt(req.query.days as string) || 7;
      const sleepData = await storage.getUserRecentSleepData(userId, days);
      
      res.json(sleepData);
    } catch (error) {
      console.error("Error fetching recent sleep data:", error);
      res.status(500).json({ error: "Failed to fetch sleep data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
