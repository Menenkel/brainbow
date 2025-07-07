import { TodaySchedule } from "@/components/TodaySchedule";
import { SleepCheckIn } from "@/components/SleepCheckIn";
import { EmotionalStateUpdate } from "@/components/EmotionalStateUpdate";
import { AutoDayPlanner } from "@/components/AutoDayPlanner";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Navbar } from "@/components/Navbar";
import { useCalendarSync } from "@/hooks/use-calendar-sync";

export default function Dashboard() {
  // Initialize calendar sync with auto-sync enabled and periodic sync every 30 minutes
  const { isSync, isConfigured } = useCalendarSync({
    enableAutoSync: true,
    syncInterval: 30,
    showToasts: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900/20">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Weather Widget - Full Width at Top */}
        <div className="mb-6 animate-fade-in-up">
          <WeatherWidget />
        </div>

        {/* Split Check-In - Sleep & Emotional State */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up">
          <SleepCheckIn />
          <EmotionalStateUpdate />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Calendar & Schedule */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }} id="schedule-column">
            <TodaySchedule />
          </div>

          {/* Right Column: AI Planning - Height constrained to match left column */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="sticky top-6">
              <AutoDayPlanner scheduleColumnId="schedule-column" />
            </div>
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
