import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, RotateCcw, MessageSquare, Calendar, Clock, Cloud, Moon, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  response: string;
  timestamp: string;
}

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  context: string;
  timestamp: string;
}

interface SleepData {
  id: number;
  userId: number;
  date: string;
  sleepQuality: string;
  sleepHours: number;
  wakeUpTime: string;
  notes: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  type: string;
}

interface WeatherData {
  current: {
    description: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

export function AutoDayPlanner() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [autoPlanGenerated, setAutoPlanGenerated] = useState(false);
  const [chatReset, setChatReset] = useState(false);
  const [lastDataSnapshot, setLastDataSnapshot] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all relevant data
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
    queryFn: async () => {
      const response = await fetch('/api/chat/history');
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: moodData } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood'],
    queryFn: async () => {
      const response = await fetch('/api/mood');
      if (!response.ok) throw new Error('Failed to fetch mood data');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const { data: sleepData } = useQuery<SleepData>({
    queryKey: ['/api/sleep/today'],
    queryFn: async () => {
      const response = await fetch('/api/sleep/today');
      if (!response.ok) throw new Error('Failed to fetch sleep data');
      return response.json();
    },
    refetchInterval: 15000,
  });

  const { data: todayEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events/today'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/events/today');
      if (!response.ok) throw new Error('Failed to fetch today events');
      return response.json();
    },
    refetchInterval: 20000,
  });

  const { data: weatherData } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    queryFn: async () => {
      const response = await fetch('/api/weather');
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Enhanced chat mutation with better context
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('POST', '/api/chat', { message });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "AI Response",
        description: "Your AI companion has responded!",
      });
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/chat/reset');
    },
    onSuccess: () => {
      setMessages([]);
      setAutoPlanGenerated(true);
      setChatReset(true);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setTimeout(() => setChatReset(false), 1000);
      toast({
        title: "Chat Reset",
        description: "Starting fresh conversation.",
      });
    },
    onError: (error) => {
      console.error("Chat reset error:", error);
      toast({
        title: "Reset Error",
        description: "Failed to reset chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to generate contextual prompts based on data changes
  const generateContextualPrompt = (currentData: any, previousData: any) => {
    const prompts = [];

    // Check for new mood entries
    if (currentData.mood && (!previousData?.mood || currentData.mood.length > previousData.mood.length)) {
      const latestMood = currentData.mood[0];
      const moodText = latestMood.mood === '😰' ? 'anxious' : 
                     latestMood.mood === '😊' ? 'happy' : 
                     latestMood.mood === '😤' ? 'frustrated' : 
                     latestMood.mood === '😴' ? 'tired' : 'neutral';
      prompts.push(`I just updated my mood to ${moodText} (${latestMood.mood}). Can you help me with some stress management techniques?`);
    }

    // Check for new sleep data
    if (currentData.sleep && (!previousData?.sleep || 
        currentData.sleep.sleepHours !== previousData.sleep?.sleepHours ||
        currentData.sleep.sleepQuality !== previousData.sleep?.sleepQuality)) {
      const quality = currentData.sleep.sleepQuality;
      const hours = currentData.sleep.sleepHours;
      prompts.push(`I logged my sleep: ${hours} hours of ${quality} quality sleep. How might this affect my day and what should I focus on?`);
    }

    // Check for upcoming calendar events (next 2 hours)
    if (currentData.events && currentData.events.length > 0) {
      const now = new Date();
      const upcomingEvents = currentData.events.filter((event: CalendarEvent) => {
        const eventStart = new Date(event.startTime);
        const timeDiff = eventStart.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // Next 2 hours
      });

      if (upcomingEvents.length > 0) {
        const event = upcomingEvents[0];
        const eventTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        prompts.push(`I have "${event.title}" coming up at ${eventTime}. Given my current mood and energy levels, how should I prepare for this?`);
      }
    }

    // Check for weather impact
    if (currentData.weather && currentData.mood) {
      const weather = currentData.weather.current;
      const latestMood = currentData.mood[0];
      const moodText = latestMood.mood === '😰' ? 'anxious' : 
                     latestMood.mood === '😊' ? 'happy' : 
                     latestMood.mood === '😤' ? 'frustrated' : 
                     latestMood.mood === '😴' ? 'tired' : 'neutral';
      
      if (weather.description.toLowerCase().includes('rain') || weather.description.toLowerCase().includes('cloud')) {
        prompts.push(`It's ${weather.description.toLowerCase()} and ${weather.temperature}°C outside, and I'm feeling ${moodText}. Can you suggest some mood-boosting activities?`);
      }
    }

    return prompts;
  };

  // Auto-generate contextual messages based on data changes
  useEffect(() => {
    if (chatReset || !moodData || !sleepData || !todayEvents || !weatherData) return;

    const currentData = {
      mood: moodData,
      sleep: sleepData,
      events: todayEvents,
      weather: weatherData,
    };

    // Generate contextual prompts if data has changed
    const contextualPrompts = generateContextualPrompt(currentData, lastDataSnapshot);
    
    if (contextualPrompts.length > 0 && !chatMutation.isPending) {
      // Send the most relevant prompt
      const selectedPrompt = contextualPrompts[0];
      chatMutation.mutate(selectedPrompt);
      setAutoPlanGenerated(true);
    }

    setLastDataSnapshot(currentData);
  }, [moodData, sleepData, todayEvents, weatherData, chatReset, chatMutation.isPending]);

  // Update messages when chat history changes
  useEffect(() => {
    if (chatHistory) {
      console.log('Chat history received:', chatHistory);
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  const sendChatMessage = (message: string) => {
    if (!message.trim()) return;
    chatMutation.mutate(message);
    setNewMessage("");
  };

  const handleSubmit = () => {
    if (!newMessage.trim()) return;
    sendChatMessage(newMessage);
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Generate data summary for display
  const getDataSummary = () => {
    const summary = [];
    
    if (sleepData) {
      summary.push(`${sleepData.sleepHours}h ${sleepData.sleepQuality} sleep`);
    }
    
    if (moodData && moodData.length > 0) {
      const latestMood = moodData[0];
      summary.push(`Mood: ${latestMood.mood}`);
    }
    
    if (weatherData) {
      summary.push(`${weatherData.current.temperature}°C, ${weatherData.current.description}`);
    }
    
    if (todayEvents && todayEvents.length > 0) {
      summary.push(`${todayEvents.length} events today`);
    }
    
    return summary;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Daily Companion</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {getDataSummary().map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
            <Button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 w-full pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your AI companion is analyzing your data...</p>
                <p className="text-sm">Updates on mood, sleep, calendar, and weather will trigger personalized suggestions.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.message && (
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  )}
                  {msg.response && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg max-w-md">
                        <p className="text-sm whitespace-pre-wrap text-gray-900">
                          {msg.response || "[No response content]"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(msg.timestamp)} • Length: {msg.response?.length || 0}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">AI is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about your day, stress management, or get personalized suggestions..."
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button 
            onClick={handleSubmit}
            disabled={chatMutation.isPending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}