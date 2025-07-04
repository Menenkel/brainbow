import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TodaySchedule } from "@/components/TodaySchedule";
import { SleepCheckIn } from "@/components/SleepCheckIn";
import { EmotionalStateUpdate } from "@/components/EmotionalStateUpdate";
import { AutoDayPlanner } from "@/components/AutoDayPlanner";
import { Navbar } from "@/components/Navbar";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Check Google Calendar status
  const { data: calendarStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/google-calendar/status'],
  });

  // Auto-sync Google Calendar when app opens
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/google-calendar/sync', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error) => {
      console.log('Calendar sync failed:', error);
    }
  });

  // Automatically sync calendar on component mount if configured
  useEffect(() => {
    if (calendarStatus?.configured && !syncMutation.isPending) {
      syncMutation.mutate();
    }
  }, [calendarStatus?.configured]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900/20">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Split Check-In - Sleep & Emotional State */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
          <SleepCheckIn />
          <EmotionalStateUpdate />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Calendar & Schedule */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <TodaySchedule />
          </div>

          {/* Right Column: AI Planning & Chat */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <AutoDayPlanner />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center">
          <span className="text-xl">✨</span>
        </button>
      </div>
    </div>
  );
}
