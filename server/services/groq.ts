import fetch from "node-fetch";

export interface PlanningResponse {
  tasks: Array<{
    title: string;
    priority: "high" | "medium" | "low";
    estimatedTime: number; // in minutes
    description?: string;
  }>;
  recommendations: string[];
  wellnessTips: string[];
}

export interface AnxietyResponse {
  techniques: string[];
  affirmation: string;
  breathingExercise: {
    name: string;
    instructions: string;
    duration: number; // in seconds
  };
  recommendations: string[];
}

export interface SwotResponse {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actionPlan: string[];
  confidence: string;
}

export interface PlanDayResponse {
  schedule: string;
  adjustedEvents: Array<{
    time: string;
    title: string;
    type: "fixed" | "movable" | "break";
    notes?: string;
  }>;
}

// Groq API configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY; // Set this in your environment variables

async function callGroqAPI(messages: any[], temperature = 0.7, model = "llama3-8b-8192"): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 200  // Reasonable limit for concise but complete responses
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  return response.json() as any;
}

export async function getChatResponse(message: string, calendarEvents?: any[], tasks?: any[], context?: string): Promise<string> {
  try {
    // Format calendar events for context
    const now = new Date();
    const eventsContext = calendarEvents && calendarEvents.length > 0
      ? `\n\nUpcoming Calendar Events:\n${calendarEvents
          .filter(event => new Date(event.startTime) > now)
          .slice(0, 5)
          .map(event => {
            const startDate = new Date(event.startTime);
            const endDate = new Date(event.endTime);
            
            const isToday = startDate.toDateString() === now.toDateString();
            const isTomorrow = startDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
            
            let dayPrefix = '';
            if (isToday) dayPrefix = 'Today: ';
            else if (isTomorrow) dayPrefix = 'Tomorrow: ';
            else dayPrefix = `${startDate.toLocaleDateString()}: `;
            
            const startTime = startDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            });
            const endTime = endDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            });
            const movable = event.movabilityStatus === 'movable' ? ' [MOVABLE]' : ' [FIXED]';
            return `- ${dayPrefix}${event.title} (${startTime} - ${endTime})${movable}${event.location ? ` at ${event.location}` : ''}`;
          }).join('\n')}`
      : '';

    // Format tasks for context
    const tasksContext = tasks && tasks.length > 0
      ? `\n\nCurrent Tasks:\n${tasks.map(task => 
          `- ${task.title} (${task.priority} priority)${task.completed ? ' ✓' : ''}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are the user's daily companion - a caring, intuitive friend who helps them structure their day perfectly. 

🌟 CORE PERSONALITY:
- Speak naturally and conversationally (like texting a close friend)
- Use emojis naturally but sparingly (1-2 per response)
- Show genuine care and empathy
- Be encouraging but realistic

💡 PRIMARY MISSION:
- Help structure and organize their day based on mood, energy, and schedule
- Suggest optimal timing for tasks based on their current state
- Recommend moving MOVABLE calendar events to optimize their day
- Provide gentle guidance on pacing and energy management

🎯 RESPONSE GUIDELINES:
- Keep responses concise but conversational (2-4 sentences)
- Focus on ONE specific actionable suggestion
- Reference specific event names and times when relevant
- End with a question or next step to encourage engagement

RESPONSE FORMAT:
- Give specific, actionable advice about their schedule
- Mention exact event names and suggested times
- Consider their mood, energy levels, and conflicts
- Be supportive and understanding

Current context: ${context || 'Daily conversation'}${eventsContext}${tasksContext}

Remember: You're their friend who's excellent at day planning. Be natural, caring, and focus on making their day flow smoothly with specific, actionable advice.`;

    const response = await callGroqAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ], 0.3, "llama3-8b-8192"); // Lower temperature, more focused model

    const rawResponse = response.choices[0].message.content || "I'm here for you! What's on your mind today? 💙";
    
    // Light truncation for readability in chat - max 150 words
    const words = rawResponse.trim().split(/\s+/);
    const maxWords = 150;
    
    if (words.length > maxWords) {
      const truncatedWords = words.slice(0, maxWords);
      return truncatedWords.join(' ') + '...';
    }

    return rawResponse;
  } catch (error) {
    console.error("Groq chat error:", error);
    return "I'm having trouble connecting right now, but I'm here for you! 💙 Try taking a deep breath - we'll figure this out together.";
  }
}

export async function generateDailyPlan(userInput: string, calendarEvents: any[], morningEvaluation?: any): Promise<PlanningResponse> {
  try {
    const eventsContext = calendarEvents.length > 0 
      ? `Today's calendar: ${calendarEvents.map(e => `${e.title} at ${e.startTime}`).join(', ')}`
      : 'No calendar events today';

    // Add morning evaluation context
    let morningContext = '';
    if (morningEvaluation) {
      const sleepQuality = morningEvaluation.sleepQuality || 'unknown';
      const sleepHours = morningEvaluation.sleepHours || 'unknown';
      const weather = morningEvaluation.weather;
      
      morningContext = `\n\nMorning Evaluation:
- Sleep quality: ${sleepQuality} (${sleepHours} hours)
- Weather: ${weather?.description || 'unknown'}, ${weather?.temperature || 'unknown'}°C
- Wake up time: ${morningEvaluation.wakeUpTime || 'unknown'}

Please factor in the sleep quality and weather when making recommendations. Adjust energy levels and outdoor activity suggestions accordingly.`;
    }

    const prompt = `Based on the user's request, calendar, and morning evaluation, create a daily plan with task prioritization and wellness recommendations.

User request: ${userInput}
${eventsContext}${morningContext}

Provide a JSON response with:
- tasks: array of prioritized tasks with title, priority (high/medium/low), estimatedTime, description
- recommendations: array of planning tips (consider sleep quality and weather)
- wellnessTips: array of wellness suggestions (adjust for energy levels and weather)

Keep it practical and achievable. Factor in sleep quality for energy management and weather for activity suggestions.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are a helpful daily planning assistant. Always respond with valid JSON format." },
      { role: "user", content: prompt + "\n\nRespond with valid JSON only." }
    ], 0.7);

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      tasks: result.tasks || [],
      recommendations: result.recommendations || [],
      wellnessTips: result.wellnessTips || []
    };
  } catch (error) {
    console.error("Groq planning error:", error);
    return {
      tasks: [],
      recommendations: ["Take things one step at a time", "Schedule regular breaks"],
      wellnessTips: ["Remember to breathe deeply", "Stay hydrated throughout the day"]
    };
  }
}

export async function planDay(emotion: string, sleepQuality: string, weather: string, events: any[]): Promise<PlanDayResponse> {
  try {
    const prompt = `
User mood: ${emotion}
Sleep quality: ${sleepQuality}
Weather: ${weather}

Events:
${events.map(ev => `- ${ev.startTime} ${ev.title} (${ev.movable ? 'movable' : 'fixed'})`).join('\n')}

Plan a low-stress day. Keep fixed events and suggest break blocks. Return a structured plan optimized for the user's current state.

Consider:
- If sleep quality is poor, suggest shorter intensive work blocks with more breaks
- If mood is stressed, prioritize calming activities and buffer time
- If weather is bad, suggest indoor activities; if good, include outdoor options
- Fixed events cannot be moved, but movable events can be rescheduled

Provide practical, specific recommendations for a balanced day.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are an assistant that creates calming daily schedules based on user mood, sleep, weather, and calendar." },
      { role: "user", content: prompt }
    ], 0.7);

    const schedule = response.choices[0].message.content || "Unable to generate schedule at this time.";

    return {
      schedule,
      adjustedEvents: events.map(event => ({
        time: event.startTime,
        title: event.title,
        type: event.movable ? "movable" : "fixed",
        notes: event.movable ? "Can be rescheduled if needed" : "Fixed time"
      }))
    };
  } catch (error) {
    console.error("Groq plan day error:", error);
    return {
      schedule: "Unable to generate schedule. Consider taking breaks between your fixed events and prioritizing rest given your current state.",
      adjustedEvents: events.map(event => ({
        time: event.startTime,
        title: event.title,
        type: event.movable ? "movable" : "fixed"
      }))
    };
  }
}

export async function getAnxietySupport(situation: string): Promise<AnxietyResponse> {
  try {
    const prompt = `The user is experiencing anxiety about: ${situation}

Provide supportive anxiety management help with:
- techniques: array of specific coping techniques
- affirmation: a positive, personal affirmation
- breathingExercise: object with name, instructions, duration in seconds
- recommendations: array of practical next steps

Focus on immediate, actionable relief. Respond in JSON format.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are a supportive mental health assistant. Always respond with valid JSON format." },
      { role: "user", content: prompt + "\n\nRespond with valid JSON only." }
    ], 0.8);

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      techniques: result.techniques || ["Take slow, deep breaths", "Ground yourself using your five senses"],
      affirmation: result.affirmation || "I am capable of handling this moment with grace and strength.",
      breathingExercise: result.breathingExercise || {
        name: "4-7-8 Breathing",
        instructions: "Inhale for 4 counts, hold for 7 counts, exhale for 8 counts",
        duration: 60
      },
      recommendations: result.recommendations || ["Take one step at a time", "Remember that this feeling will pass"]
    };
  } catch (error) {
    console.error("Groq anxiety support error:", error);
    return {
      techniques: ["Take slow, deep breaths", "Ground yourself using your five senses", "Focus on what you can control"],
      affirmation: "I am capable of handling this moment with grace and strength.",
      breathingExercise: {
        name: "4-7-8 Breathing",
        instructions: "Inhale for 4 counts, hold for 7 counts, exhale for 8 counts. Repeat 4 times.",
        duration: 60
      },
      recommendations: ["Take one step at a time", "Remember that this feeling will pass", "Reach out for support if needed"]
    };
  }
}

export async function generateSwotAnalysis(situation: string, calendarEvents: any[] = []): Promise<SwotResponse> {
  try {
    const eventsContext = calendarEvents.length > 0 
      ? `\n\nUpcoming events context: ${calendarEvents.slice(0, 3).map(e => `${e.title} at ${new Date(e.startTime).toLocaleDateString()}`).join(', ')}`
      : '';

    const prompt = `Analyze this anxiety-inducing situation using SWOT framework: ${situation}${eventsContext}

Provide a JSON response with:
- strengths: array of personal strengths to leverage
- weaknesses: array of areas that might challenge the person
- opportunities: array of positive possibilities from this situation
- threats: array of potential risks or concerns
- actionPlan: array of specific, actionable steps
- confidence: a supportive confidence-building message

Focus on empowerment and practical solutions. Be encouraging but realistic.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are a supportive analysis assistant. Always respond with valid JSON format." },
      { role: "user", content: prompt + "\n\nRespond with valid JSON only." }
    ], 0.7);

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      opportunities: Array.isArray(result.opportunities) ? result.opportunities : [],
      threats: Array.isArray(result.threats) ? result.threats : [],
      actionPlan: Array.isArray(result.actionPlan) ? result.actionPlan : [],
      confidence: result.confidence || "You have the strength to handle this challenge."
    };
  } catch (error) {
    console.error("Groq SWOT analysis error:", error);
    return {
      strengths: ["You have the awareness to identify this concern", "You're taking proactive steps by analyzing this"],
      weaknesses: ["Uncertainty about the outcome", "Natural anxiety about important events"],
      opportunities: ["Chance to build confidence", "Opportunity to develop coping strategies"],
      threats: ["Overthinking could increase anxiety", "Perfectionism might create extra pressure"],
      actionPlan: ["Break the situation into smaller, manageable steps", "Prepare thoroughly but accept imperfection", "Practice self-compassion"],
      confidence: "You have successfully navigated challenges before. Trust in your ability to handle whatever comes your way."
    };
  }
}

export async function generateAffirmation(mood?: string): Promise<string> {
  try {
    const prompt = mood 
      ? `Generate a personalized, uplifting affirmation for someone feeling ${mood}. Make it specific, empowering, and authentic.`
      : `Generate a positive, empowering daily affirmation. Make it personal and encouraging.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are a supportive wellness coach that creates meaningful affirmations." },
      { role: "user", content: prompt }
    ], 0.8);

    return response.choices[0].message.content || "I am capable, resilient, and ready to embrace today's possibilities.";
  } catch (error) {
    console.error("Groq affirmation error:", error);
    const defaultAffirmations = [
      "I am capable, resilient, and ready to embrace today's possibilities.",
      "I trust in my ability to navigate any challenge that comes my way.",
      "I am worthy of success, happiness, and peace.",
      "Each moment brings new opportunities for growth and joy.",
      "I choose to focus on what I can control and let go of what I cannot."
    ];
    return defaultAffirmations[Math.floor(Math.random() * defaultAffirmations.length)];
  }
}