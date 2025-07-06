import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  type: string;
}

export function WeeklyCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentWeek);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events", weekStart.toISOString(), weekEnd.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/events?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const generateCalendarDays = () => {
    const days = [];
    const startDate = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      const isToday = currentDate.toDateString() === new Date().toDateString();
      
      days.push({
        date: currentDate.getDate(),
        fullDate: currentDate,
        events: dayEvents,
        isToday,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const formatWeekRange = () => {
    const startMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    
    return `${startMonth} ${startDay}-${endDay}`;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getEventDots = (events: CalendarEvent[]) => {
    if (events.length === 0) return null;
    
    const colors = {
      meeting: "bg-primary",
      presentation: "bg-accent",
      wellness: "bg-secondary",
      event: "bg-neutral-400",
    };

    const dots = events.slice(0, 3).map((event, index) => (
      <div
        key={index}
        className={`w-1 h-1 rounded-full ${colors[event.type as keyof typeof colors] || colors.event}`}
      />
    ));

    return (
      <div className="flex space-x-0.5 mt-1">
        {dots}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-200">This Week</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek("prev")}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-500" />
          </Button>
          <span className="text-sm text-neutral-500 min-w-0">
            {formatWeekRange()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek("next")}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div key={index} className="aspect-square p-1">
            <div
              className={`h-full flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
                day.isToday
                  ? "bg-primary text-white"
                  : day.events.length > 0
                  ? "bg-primary/10 hover:bg-primary/20"
                  : "hover:bg-neutral-50"
              }`}
            >
              <span
                className={`text-sm ${
                  day.isToday
                    ? "font-semibold text-white"
                    : day.events.length > 0
                    ? "font-medium text-primary"
                    : "text-neutral-800"
                }`}
              >
                {day.date}
              </span>
              {getEventDots(day.events)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
