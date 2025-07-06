import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Send, RotateCcw, Sparkles } from "lucide-react";

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  timestamp: Date;
}

interface AutoPlanRequest {
  emotion?: string;
  sleepQuality?: string;
  sleepHours?: number;
  weather?: any;
  calendarEvents?: any[];
  currentTime?: string;
}

export function AutoDayPlanner() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [autoPlanGenerated, setAutoPlanGenerated] = useState(false);
  const [chatReset, setChatReset] = useState(false);
  const { toast } = useToast();

  // Get today's calendar events
  const { data: todayEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/calendar/events/today"],
  });

  // Get latest mood for emotional state
  const { data: moods = [] } = useQuery<any[]>({
    queryKey: ["/api/mood"],
  });

  // Get today's sleep data
  const { data: todaySleepData } = useQuery<any>({
    queryKey: ["/api/sleep/today"],
  });

  // Get chat history
  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
  });

  // Load chat history
  useEffect(() => {
    if (chatHistory.length > 0 && !chatReset) {
      setMessages(chatHistory);
    }
  }, [chatHistory, chatReset]);

  // Auto-generate daily plan once when data is available
  useEffect(() => {
    if (!autoPlanGenerated && !chatReset) {
      // Get latest emotional state
      const latestEmotion = moods.find((mood: any) => {
        const context = mood.context ? JSON.parse(mood.context) : null;
        return context?.type === "emotional_state";
      });

      // Generate plan with combined data sources
      const planData = {
        // Sleep data from separate sleep check-in
        sleepQuality: todaySleepData?.sleepQuality || "fair",
        sleepHours: todaySleepData?.sleepHours || 7,
        wakeUpTime: todaySleepData?.wakeUpTime,
        
        // Emotional state from separate mood updates
        emotion: latestEmotion ? JSON.parse(latestEmotion.context).emotion : "neutral",
        emotionNotes: latestEmotion ? JSON.parse(latestEmotion.context).notes : "",
        
        // Weather (simulated for now)
        weather: { description: "mild conditions", temperature: 20 },
        
        // Calendar events
        calendarEvents: todayEvents
      };

      generateAutoPlan(planData);
      setAutoPlanGenerated(true);
    }
  }, [moods.length, todayEvents.length, todaySleepData, autoPlanGenerated, chatReset]);

  const generateAutoPlan = async (planData: any) => {
    // Enhanced context with three-state movability analysis
    const fixedEvents = todayEvents.filter((event: any) => event.movabilityStatus === "fixed");
    const movableEvents = todayEvents.filter((event: any) => event.movabilityStatus === "movable");
    const unsureEvents = todayEvents.filter((event: any) => event.movabilityStatus === "unsure" || !event.movabilityStatus);

    const contextMessage = `AUTOMATIC DAILY PLANNING REQUEST

Sleep Data:
- Quality: ${planData.sleepQuality} (${planData.sleepHours} hours)
- Wake Time: ${planData.wakeUpTime || "Not specified"}

Emotional State:
- Current Emotion: ${planData.emotion}
- Notes: ${planData.emotionNotes || "None"}

Weather Context:
- Conditions: ${planData.weather.description}, ${planData.weather.temperature}°C

Calendar Analysis:
- Total Events: ${todayEvents.length}
- Fixed Events (cannot be moved): ${fixedEvents.length}
- Movable Events (flexible): ${movableEvents.length}
- Unsure Events (status unclear): ${unsureEvents.length}

Context for AI Planning:
Based on sleep quality, emotional state, weather, and calendar commitments, provide a comprehensive daily plan with:

1. Energy Management: Recommendations based on sleep quality and emotional state
2. Task Scheduling: Optimal timing for movable events considering energy levels
3. Wellness Integration: Mood-appropriate breaks and stress management
4. Weather Adaptation: Outdoor/indoor activity suggestions
5. Emotional Support: Strategies matching current emotional state

Current Time: ${new Date().toLocaleTimeString()}

Please provide structured guidance for optimizing this day.`;

    sendChatMessage(contextMessage);
  };

  const sendChatMessage = async (message: string) => {
    const context = {
      calendarEvents: todayEvents,
      currentTime: new Date().toISOString(),
      sleepData: todaySleepData,
      emotionalState: moods.find((mood: any) => {
        const context = mood.context ? JSON.parse(mood.context) : null;
        return context?.type === "emotional_state";
      })
    };

    chatMutation.mutate({ 
      message, 
      context: JSON.stringify(context)
    });
  };

  const chatMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: string }) => {
      return await apiRequest('POST', '/api/chat', { message, context });
    },
    onSuccess: (data: any) => {
      const newChatMessage: ChatMessage = {
        id: Date.now(),
        message: newMessage || "Auto-generated planning request",
        response: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newChatMessage]);
      setNewMessage("");
      toast({
        title: "AI Planning Complete",
        description: "Your daily plan has been generated based on your current state.",
      });
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast({
        title: "Planning Failed",
        description: "Could not generate daily plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!newMessage.trim()) return;
    sendChatMessage(newMessage);
  };

  const handleReset = () => {
    setMessages([]);
    setAutoPlanGenerated(false);
    setChatReset(true);
    setTimeout(() => setChatReset(false), 100);
    toast({
      title: "Chat Reset",
      description: "Starting fresh conversation.",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-purple-800 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Day Planner
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat History */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              {msg.message && (
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">You</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {formatTime(new Date(msg.timestamp))}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{msg.message}</p>
                </div>
              )}
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    AI Planner
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    {formatTime(new Date(msg.timestamp))}
                  </span>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                  {msg.response}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="space-y-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask for additional planning help, adjustments, or specific advice..."
            rows={2}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={chatMutation.isPending || !newMessage.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            {chatMutation.isPending ? (
              "Generating plan..."
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}