import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Brain, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PlanDayResponse {
  schedule: string;
  adjustedEvents: Array<{
    time: string;
    title: string;
    type: "fixed" | "movable" | "break";
    notes?: string;
  }>;
}

export function DayPlanner() {
  const [emotion, setEmotion] = useState<string>("");
  const [sleepQuality, setSleepQuality] = useState<string>("");
  const [planGenerated, setPlanGenerated] = useState<PlanDayResponse | null>(null);
  const { toast } = useToast();

  // Get today's calendar events
  const { data: calendarEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/calendar/events/today"],
  });

  // Get weather from completed morning evaluation
  const { data: moods = [] } = useQuery<any[]>({
    queryKey: ["/api/mood"],
  });

  const lastMorningEvaluation = moods.find((mood: any) => {
    const context = mood.context ? JSON.parse(mood.context) : null;
    return context?.type === "morning_evaluation" && 
           new Date(mood.timestamp).toDateString() === new Date().toDateString();
  });

  const weatherSummary = lastMorningEvaluation ? 
    JSON.parse(lastMorningEvaluation.context).weather : null;

  const planDayMutation = useMutation({
    mutationFn: async (data: {
      emotion: string;
      sleepQuality: string;
      weather: string;
      events: any[];
    }) => {
      const response = await apiRequest("POST", "/api/plan-day", data);
      return response.json();
    },
    onSuccess: (data: PlanDayResponse) => {
      setPlanGenerated(data);
      toast({
        title: "Daily Plan Generated! 📋",
        description: "Your personalized schedule is ready based on your current state.",
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error("Plan day error:", error);
      toast({
        title: "Planning Failed",
        description: "Could not generate daily plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!emotion || !sleepQuality) {
      toast({
        title: "Missing Information",
        description: "Please select your current emotion and sleep quality.",
        variant: "destructive",
      });
      return;
    }

    const weather = weatherSummary ? 
      `${weatherSummary.description}, ${weatherSummary.temperature}°C` : 
      "Unknown weather conditions";

    const events = calendarEvents.map((event: any) => ({
      startTime: new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: event.title,
      movable: event.type !== "google-calendar" // Google calendar events are fixed
    }));

    planDayMutation.mutate({
      emotion,
      sleepQuality,
      weather,
      events
    });
  };

  const handleReset = () => {
    setPlanGenerated(null);
    setEmotion("");
    setSleepQuality("");
  };

  if (planGenerated) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Target className="h-6 w-6 text-purple-500" />
            <span>Your Optimized Day Plan</span>
          </CardTitle>
          <CardDescription>
            Personalized schedule based on your mood and energy levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span>AI Recommendations</span>
            </h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {planGenerated.schedule}
            </div>
          </div>

          {planGenerated.adjustedEvents.length > 0 && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Your Events</span>
              </h4>
              <div className="space-y-2">
                {planGenerated.adjustedEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/70 dark:bg-gray-700/70 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{event.time}</span>
                      <span className="text-sm">{event.title}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.type === "fixed" 
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-center pt-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="text-sm"
            >
              Generate New Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <CalendarDays className="h-6 w-6 text-purple-500" />
          <span>AI Day Planner</span>
        </CardTitle>
        <CardDescription>
          Get a personalized schedule based on your current mood and energy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Emotion */}
          <div className="space-y-2">
            <Label htmlFor="emotion" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>How are you feeling right now?</span>
            </Label>
            <Select value={emotion} onValueChange={setEmotion}>
              <SelectTrigger>
                <SelectValue placeholder="Select your current emotion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stressed">😰 Stressed - Feeling overwhelmed</SelectItem>
                <SelectItem value="tired">😴 Tired - Low energy, need rest</SelectItem>
                <SelectItem value="anxious">😟 Anxious - Worried about tasks</SelectItem>
                <SelectItem value="focused">🎯 Focused - Ready to tackle challenges</SelectItem>
                <SelectItem value="energetic">⚡ Energetic - High energy, motivated</SelectItem>
                <SelectItem value="calm">😌 Calm - Peaceful and balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sleep Quality Override */}
          <div className="space-y-2">
            <Label htmlFor="sleep-override" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>How was your sleep?</span>
            </Label>
            <Select value={sleepQuality} onValueChange={setSleepQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Confirm sleep quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">😴 Excellent - Fully rested</SelectItem>
                <SelectItem value="good">😊 Good - Well rested</SelectItem>
                <SelectItem value="fair">😐 Fair - Somewhat tired</SelectItem>
                <SelectItem value="poor">😞 Poor - Very tired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Context Information */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Planning Context:</strong>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
            <div>📅 Today's events: {calendarEvents.length || 0} scheduled</div>
            <div>🌤️ Weather: {weatherSummary ? 
              `${weatherSummary.description}, ${weatherSummary.temperature}°C` : 
              "Complete morning evaluation for weather context"
            }</div>
          </div>
        </div>

        {/* Generate Plan Button */}
        <Button
          onClick={handleGeneratePlan}
          disabled={!emotion || !sleepQuality || planDayMutation.isPending}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          {planDayMutation.isPending ? (
            <>
              <Brain className="mr-2 h-4 w-4 animate-spin" />
              AI is Planning Your Day...
            </>
          ) : (
            <>
              <Target className="mr-2 h-4 w-4" />
              Generate Optimized Day Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}