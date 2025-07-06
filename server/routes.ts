import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChatResponse, generateSwotAnalysis, getAnxietySupport, generateDailyPlan, planDay, generateAffirmation } from "./services/groq";
import { syncGoogleCalendarEvents, isGoogleCalendarConfigured, getAuthorizationUrl, exchangeCodeForTokens } from "./services/googleCalendar";
import { insertMoodSchema, insertChatMessageSchema, insertCalendarEventSchema, insertTaskSchema, insertWellnessActivitySchema } from "@shared/schema";
import type { CalendarEvent } from "@shared/schema";
import fetch from "node-fetch";

// Enhanced message context function
async function enhanceMessageWithContext(message: string, userId: number): Promise<string> {
  try {
    // Get fresh user data
    const today = new Date().toISOString().split('T')[0];
    const [moodData, sleepData, calendarEvents] = await Promise.all([
      storage.getUserMoods(userId, 5),
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

    // Format context information
    let contextInfo = `\n\n=== USER CONTEXT ===\n`;
    
    // Current mood context
    if (moodData.length > 0) {
      const latestMood = moodData[0];
      const moodText = latestMood.mood === '😰' ? 'anxious' : 
                     latestMood.mood === '😊' ? 'happy' : 
                     latestMood.mood === '😤' ? 'frustrated' : 
                     latestMood.mood === '😴' ? 'tired' : 'neutral';
      contextInfo += `Current mood: ${moodText} (${latestMood.mood})\n`;
      
      // Parse mood context if available
      try {
        const moodContext = JSON.parse(latestMood.context || '{}');
        if (moodContext.type) {
          contextInfo += `Mood context: ${moodContext.type}\n`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Sleep context
    if (sleepData) {
      contextInfo += `Sleep: ${sleepData.sleepHours} hours of ${sleepData.sleepQuality} quality sleep\n`;
      if (sleepData.wakeUpTime) {
        contextInfo += `Wake up time: ${sleepData.wakeUpTime}\n`;
      }
    }

    // Calendar context - be specific about events
    if (todayEvents.length > 0) {
      contextInfo += `\nToday's Events:\n`;
      todayEvents.forEach((event: CalendarEvent) => {
        const startTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        contextInfo += `- ${startTime}-${endTime}: "${event.title}"`;
        if (event.description) {
          contextInfo += ` (${event.description.substring(0, 100)}...)`;
        }
        contextInfo += `\n`;
      });
    }

    // Upcoming events context
    if (upcomingEvents.length > 0) {
      contextInfo += `\nUpcoming Events (next 4 hours):\n`;
      upcomingEvents.forEach((event: CalendarEvent) => {
        const startTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeUntil = Math.round((new Date(event.startTime).getTime() - now.getTime()) / (1000 * 60));
        contextInfo += `- "${event.title}" in ${timeUntil} minutes (${startTime})`;
        if (event.description) {
          contextInfo += ` - ${event.description.substring(0, 50)}...`;
        }
        contextInfo += `\n`;
      });
    }

    // Time context
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    contextInfo += `\nCurrent time: ${currentTime} on ${currentDate}\n`;

    contextInfo += `=== END CONTEXT ===\n\n`;

    // Enhanced message with specific instructions for contextual responses
    const enhancedMessage = `${contextInfo}User message: "${message}"

IMPORTANT INSTRUCTIONS:
1. If the user mentions feeling stressed, anxious, or overwhelmed, immediately offer specific stress management techniques
2. If upcoming calendar events are mentioned or you see stressful events coming up, provide preparation strategies
3. Reference specific event titles and times when giving advice (e.g., "For your 'Team Meeting' at 2:00 PM...")
4. Consider sleep quality when making energy-related suggestions
5. Be proactive - if you notice patterns that might cause stress, address them
6. Offer concrete, actionable advice rather than generic responses
7. If the user's mood seems negative and they have upcoming events, help them prepare mentally
8. Always acknowledge the specific context (mood, sleep, events) in your response

Respond as a caring, proactive AI companion who pays attention to details and provides personalized stress management advice.`;

    return enhancedMessage;
  } catch (error) {
    console.error('Error enhancing message context:', error);
    return message;
  }
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
      const moods = await storage.getUserMoods(DEFAULT_USER_ID, 10);
      res.json(moods);
    } catch (error) {
      console.error("Mood fetch error:", error);
      res.status(500).json({ error: "Failed to fetch moods" });
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
