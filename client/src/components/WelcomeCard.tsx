import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTime } from "@/hooks/use-time";
import { apiRequest } from "@/lib/queryClient";
import { Wind, Heart, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
}

const moodEmojis = ["😊", "😐", "😔", "😰", "😌"];

export function WelcomeCard() {
  const { timeString, dateString } = useTime();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todayEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events/today"],
  });

  const getNextEvent = () => {
    const now = new Date();
    const upcomingEvents = todayEvents
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return upcomingEvents[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if this is an all-day event (midnight time or ends at 23:59)
    if ((date.getUTCHours() === 0 && date.getUTCMinutes() === 0) || 
        dateString.includes("T00:00:00.000Z")) {
      return "All day";
    }
    
    // For timed events, convert UTC to local timezone and display
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
  };

  const nextEvent = getNextEvent();

  const moodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const response = await apiRequest("POST", "/api/mood", { mood });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood recorded",
        description: "Thanks for sharing how you're feeling today!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
    },
  });

  const breathingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wellness/activities", {
        type: "breathing",
        duration: 240,
        completed: false,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Breathing session started",
        description: "Take a moment to focus on your breath.",
      });
    },
  });

  const affirmationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/ai/affirmation");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Daily Affirmation",
        description: data.affirmation,
        duration: 5000,
      });
    },
  });

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    moodMutation.mutate(mood);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-gray-200">Good Morning! 👋</h2>
          <p className="text-sm text-neutral-500 dark:text-gray-400">{dateString}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{timeString}</div>
        </div>
      </div>

      {/* Daily Appointments Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-medium text-neutral-700 dark:text-gray-300">Today's Schedule</h3>
        </div>
        
        {todayEvents.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-gray-400">
            You have a clear schedule today! Perfect time to focus on wellness and personal goals.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              You have {todayEvents.length} appointment{todayEvents.length !== 1 ? 's' : ''} today.
            </p>
            
            {nextEvent && (
              <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-800/20 rounded-lg p-2">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-medium">Up next:</span> {nextEvent.title} at {formatTime(nextEvent.startTime)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mood Check-in */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-gray-300 mb-3">How are you feeling today?</h3>
        <div className="flex justify-between">
          {moodEmojis.map((mood, index) => (
            <button
              key={index}
              onClick={() => handleMoodSelect(mood)}
              className={`w-10 h-10 rounded-full hover:scale-110 transition-transform text-2xl ${
                selectedMood === mood ? "bg-secondary/20 ring-2 ring-secondary" : ""
              }`}
              disabled={moodMutation.isPending}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Wellness Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => breathingMutation.mutate()}
          disabled={breathingMutation.isPending}
          className="flex items-center justify-center space-x-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl p-3 transition-colors disabled:opacity-50"
        >
          <Wind className="h-4 w-4" />
          <span className="text-sm font-medium">Breathe</span>
        </button>
        <button 
          onClick={() => affirmationMutation.mutate()}
          disabled={affirmationMutation.isPending}
          className="flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl p-3 transition-colors disabled:opacity-50"
        >
          <Heart className="h-4 w-4" />
          <span className="text-sm font-medium">Affirm</span>
        </button>
      </div>
    </div>
  );
}
