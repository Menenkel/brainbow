import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, RotateCcw, MessageSquare, Calendar, Clock, Cloud, Moon, Heart, Bot, User } from "lucide-react";
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
  timestamp: string;
  context?: string;
}

interface SleepData {
  id?: number;
  userId: number;
  sleepHours: number;
  sleepQuality: string;
  wakeUpTime?: string;
  notes?: string;
  date: string;
}

interface CalendarEvent {
  id: number;
  userId: number;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  isMovable?: boolean;
  movabilityStatus?: string;
  type: string;
  googleId?: string;
}

interface WeatherData {
  current: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    temperature: number;
    description: string;
  }>;
}

interface AutoDayPlannerProps {
  scheduleColumnId: string;
}

export function AutoDayPlanner({ scheduleColumnId }: AutoDayPlannerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [lastDataSnapshot, setLastDataSnapshot] = useState<any>(null);
  const [lastProactiveCheck, setLastProactiveCheck] = useState<Date>(new Date());
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatHeight, setChatHeight] = useState("400px"); // Initial reasonable height

  // Function to measure and match schedule column height
  const updateChatHeight = () => {
    const scheduleElement = document.getElementById(scheduleColumnId);
    if (scheduleElement) {
      const scheduleHeight = scheduleElement.offsetHeight;
      setChatHeight(`${scheduleHeight}px`);
    }
  };

  // Update height on component mount and window resize
  useEffect(() => {
    // Delay initial measurement to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateChatHeight, 100);
    
    const handleResize = () => {
      updateChatHeight();
    };

    window.addEventListener('resize', handleResize);
    
    // Also update when content changes (using MutationObserver)
    const scheduleElement = document.getElementById(scheduleColumnId);
    if (scheduleElement) {
      const observer = new MutationObserver(() => {
        // Debounce the height update
        clearTimeout(timeoutId);
        setTimeout(updateChatHeight, 100);
      });
      observer.observe(scheduleElement, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [scheduleColumnId]);

  // Fetch all relevant data with different intervals for proactive monitoring
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
    queryFn: async () => {
      const response = await fetch('/api/chat/history');
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json();
    },
    refetchInterval: 3000, // Check more frequently for real-time feel
  });

  const { data: moodData } = useQuery<MoodEntry[]>({
    queryKey: ['/api/mood'],
    queryFn: async () => {
      const response = await fetch('/api/mood');
      if (!response.ok) throw new Error('Failed to fetch mood data');
      return response.json();
    },
    refetchInterval: 5000, // Monitor mood changes closely
  });

  const { data: sleepData } = useQuery<SleepData>({
    queryKey: ['/api/sleep/today'],
    queryFn: async () => {
      const response = await fetch('/api/sleep/today');
      if (!response.ok) throw new Error('Failed to fetch sleep data');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const { data: todayEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events/today'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/events/today');
      if (!response.ok) throw new Error('Failed to fetch today events');
      return response.json();
    },
    refetchInterval: 15000, // Monitor calendar changes
  });

  const { data: weatherData } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    queryFn: async () => {
      console.log('🌤️ Weather API: Making request to /api/weather');
      const response = await fetch('/api/weather');
      console.log('🌤️ Weather API: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('🌤️ Weather API: Response not ok:', response.status, response.statusText);
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      console.log('🌤️ Weather API: Received data:', data);
      return data;
    },
    refetchInterval: 30000,
  });

  // Enhanced chat mutation with friend-like responses
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('🌐 API: Sending chat message to /api/chat:', message.substring(0, 100) + '...');
      const result = await apiRequest('POST', '/api/chat', { message });
      console.log('🌐 API: Chat response received');
      return result;
    },
    onMutate: () => {
      console.log('🔄 Chat mutation: onMutate - setting isTyping to true');
      setIsTyping(true);
    },
    onSuccess: (data) => {
      console.log('✅ Chat mutation: onSuccess - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setIsTyping(false);
    },
    onError: (error) => {
      console.error("❌ Chat mutation: onError", error);
      setIsTyping(false);
    },
  });

  // Reset conversation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/chat/reset');
    },
    onSuccess: () => {
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Fresh Start 🌟",
        description: "Starting a new conversation with your AI companion",
      });
      
      // After reset, immediately start with a friendly greeting
      setTimeout(() => {
        sendProactiveMessage("Hey! 👋 I'm here and ready to help you structure your day. I've been looking at your schedule and how you're feeling - want to chat about how to make today awesome?");
      }, 1000);
    },
  });

  // Proactive monitoring system
  useEffect(() => {
    console.log('🔍 useEffect triggered with data:');
    console.log('  - moodData:', moodData ? `${moodData.length} entries` : 'undefined', moodData);
    console.log('  - todayEvents:', todayEvents ? `${todayEvents.length} events` : 'undefined', todayEvents);
    console.log('  - weatherData:', weatherData ? 'available' : 'undefined', weatherData);
    console.log('  - sleepData:', sleepData ? 'available' : 'undefined', sleepData);

    // Only require essential data, sleep data is optional
    if (!moodData || !todayEvents || !weatherData) {
      console.log('❌ Early return - missing required data:');
      console.log('  - hasMood:', !!moodData, '| hasEvents:', !!todayEvents, '| hasWeather:', !!weatherData);
      console.log('  - moodData actual:', moodData);
      console.log('  - todayEvents actual:', todayEvents);
      console.log('  - weatherData actual:', weatherData);
      return;
    }

    const currentData = {
      mood: moodData,
      sleep: sleepData, // Can be undefined
      events: todayEvents,
      weather: weatherData,
    };

    // Debug current vs previous data
    console.log('📊 Data comparison:', {
      currentMoodId: currentData.mood?.[0]?.id,
      currentMoodEmoji: currentData.mood?.[0]?.mood,
      previousMoodId: lastDataSnapshot?.mood?.[0]?.id,
      previousMoodEmoji: lastDataSnapshot?.mood?.[0]?.mood,
      hasLastSnapshot: !!lastDataSnapshot,
      chatPending: chatMutation.isPending
    });

    // Check for immediate triggers (mood/calendar changes)
    const proactiveMessages = generateProactiveMessages(currentData, lastDataSnapshot);
    
    console.log('📨 Generated proactive messages:', proactiveMessages.length);
    if (proactiveMessages.length > 0) {
      console.log('📝 First message preview:', proactiveMessages[0].substring(0, 100) + '...');
    }
    
    if (proactiveMessages.length > 0 && !chatMutation.isPending) {
      console.log('🚀 Attempting to send proactive message');
      sendProactiveMessage(proactiveMessages[0]);
    } else if (proactiveMessages.length > 0 && chatMutation.isPending) {
      console.log('⏳ Chat mutation pending, skipping message send');
    }

    // Periodic check for time-based triggers
    const now = new Date();
    const timeSinceLastCheck = (now.getTime() - lastProactiveCheck.getTime()) / (1000 * 60);
    
    if (timeSinceLastCheck >= 30) { // Check every 30 minutes
      console.log('⏰ Time-based check triggered');
      setLastProactiveCheck(now);
      
      // Time-based proactive messages
      const timeBasedMessages = generateProactiveMessages(currentData, currentData);
      if (timeBasedMessages.length > 0 && !chatMutation.isPending) {
        console.log('⏰ Sending time-based message:', timeBasedMessages[0]);
        sendProactiveMessage(timeBasedMessages[0]);
      }
    }

    setLastDataSnapshot(currentData);
  }, [moodData, sleepData, todayEvents, weatherData, lastProactiveCheck, chatMutation.isPending]);

  // Enhanced proactive message generation with better mood change detection
  const generateProactiveMessages = (currentData: any, previousData: any) => {
    console.log('🎯 generateProactiveMessages called');
    const messages = [];
    const now = new Date();
    const timeOfDay = now.getHours();

    console.log('🎯 Message generation context:', {
      timeOfDay,
      currentMoodLength: currentData.mood?.length,
      currentMoodFirst: currentData.mood?.[0],
      previousMoodFirst: previousData?.mood?.[0],
      hasPrevious: !!previousData
    });

    // IMMEDIATE MOOD CHANGE RESPONSE (simplified - anytime)
    if (currentData.mood && currentData.mood.length > 0) {
      const latestMood = currentData.mood[0];
      const previousMood = previousData?.mood?.[0];
      
      console.log('😊 Mood comparison:', {
        current: { id: latestMood.id, mood: latestMood.mood },
        previous: previousMood ? { id: previousMood.id, mood: previousMood.mood } : 'none'
      });
      
      // Check if mood actually changed (different mood or new mood entry)
      const moodChanged = !previousMood || 
                          latestMood.mood !== previousMood.mood || 
                          latestMood.id !== previousMood.id;
      
      console.log('🔄 Mood changed?', moodChanged);
      
      if (moodChanged) {
        const moodText = getMoodText(latestMood.mood);
        console.log('✅ Mood change detected:', previousMood?.mood, '→', latestMood.mood);
        
        // ALWAYS respond to mood changes, regardless of emoji
        messages.push(`Hey there! 👋 I just noticed you updated your mood to ${latestMood.mood} (${moodText}). Thanks for sharing how you're feeling with me! 💙 I'm here to help you navigate whatever today brings. How are things going for you right now?`);
      }
    }

    // Always provide a fallback message if nothing else triggered
    if (messages.length === 0 && !previousData) {
      console.log('🌟 No previous data - sending welcome message');
      messages.push(`Hey! 👋 I'm your daily companion and I'm here to help you structure your day perfectly. I can see you have some things on your schedule, and I'm ready to help you make the most of your time. What's on your mind today?`);
    }

    console.log('📤 Final messages generated:', messages.length);
    return messages;
  };

  // Helper function to get mood text
  const getMoodText = (emoji: string) => {
    const moodMap: Record<string, string> = {
      '😊': 'happy',
      '😌': 'calm',
      '😐': 'neutral',
      '😔': 'down',
      '😰': 'anxious',
      '😤': 'frustrated',
      '😴': 'tired',
      '💪': 'energetic'
    };
    return moodMap[emoji] || 'feeling something';
  };

  // Send proactive message
  const sendProactiveMessage = (message: string) => {
    console.log('💬 sendProactiveMessage called with:', message.substring(0, 100) + '...');
    console.log('💬 chatMutation.isPending:', chatMutation.isPending);
    
    if (!chatMutation.isPending) {
      console.log('✅ Calling chatMutation.mutate');
      chatMutation.mutate(message);
    } else {
      console.log('❌ Chat mutation is pending, cannot send message');
    }
  };

  // Update messages when chat history changes
  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSubmit = () => {
    if (!newMessage.trim() || chatMutation.isPending || isTyping) return;
    
    chatMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card 
      className="flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-gray-700"
      style={{ height: chatHeight }}
    >
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Your Daily Companion</h3>
              <p className="text-sm text-blue-100">Always here when you need me 💙</p>
            </div>
          </div>
          <Button
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Heart className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">I'm getting to know you...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  I watch your mood, calendar, and daily rhythm to help you structure your day perfectly
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  {msg.message && (
                    <div className="flex justify-end">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-tr-md w-4/5">
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-white h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.response && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="text-white h-3 w-3" />
                      </div>
                      <div className="bg-neutral-100 dark:bg-gray-700 rounded-2xl rounded-tl-md p-3 w-4/5">
                        <p className="text-sm text-neutral-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {msg.response}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white h-3 w-3" />
                </div>
                <div className="bg-neutral-100 dark:bg-gray-700 rounded-2xl rounded-tl-md p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Tell me how you're feeling or ask for help..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              disabled={chatMutation.isPending || isTyping}
              className="flex-1"
            />
            <Button
              onClick={handleSubmit}
              disabled={!newMessage.trim() || chatMutation.isPending || isTyping}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}