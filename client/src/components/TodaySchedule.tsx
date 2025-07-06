import { useQuery, useMutation } from "@tanstack/react-query";
import { ExternalLink, Users, Presentation, Leaf, Clock, Calendar, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: string;
  movabilityStatus?: "fixed" | "movable" | "unsure";
}

export function TodaySchedule() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: allEvents = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
  });

  // Filter events to only show selected day
  const selectedDateString = selectedDate.toDateString();
  const events = allEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDateString;
  });

  const updateMovabilityMutation = useMutation({
    mutationFn: async ({ eventId, movabilityStatus }: { eventId: number; movabilityStatus: "fixed" | "movable" | "unsure" }) => {
      const response = await apiRequest("PATCH", `/api/calendar/events/${eventId}`, {
        movabilityStatus
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Event Updated",
        description: "Event movability preference saved.",
      });
    },
    onError: (error) => {
      console.error("Update movability error:", error);
      toast({
        title: "Update Failed",
        description: "Could not update event preference.",
        variant: "destructive",
      });
    },
  });

  // Function to cycle through three states: fixed -> movable -> unsure -> fixed
  const cycleMovabilityStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "fixed": return "movable";
      case "movable": return "unsure";
      case "unsure": return "fixed";
      default: return "unsure";
    }
  };

  // Navigate to different days
  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Format the selected date for display
  const formatSelectedDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (selectedDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (selectedDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return selectedDate.toLocaleDateString([], { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Filter events for upcoming days and group by date (for the multi-day view)
  const now = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= now; // Show current and future events
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Group events by date
  const eventsByDate = upcomingEvents.reduce((groups, event) => {
    const eventDate = new Date(event.startTime);
    const dateKey = eventDate.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting':
      case 'work':
        return <Users className="w-4 h-4" />;
      case 'presentation':
        return <Presentation className="w-4 h-4" />;
      case 'personal':
        return <Leaf className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Calculate duration
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let durationStr = '';
    if (durationHours > 0) {
      durationStr = `${durationHours}h ${durationMinutes}m`;
    } else {
      durationStr = `${durationMinutes}m`;
    }
    
    return { startStr, endStr, durationStr };
  };

  const getEventDate = (startTime: string) => {
    const eventDate = new Date(startTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (eventDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const isEventHappening = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Schedule
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(-1)}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            disabled={isToday}
            className="px-3"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate(1)}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Date Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSelectedDate()}
          </h4>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="h-px bg-gray-200 dark:bg-gray-600 mt-2"></div>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No events scheduled for {formatSelectedDate().toLowerCase()}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Your Google Calendar events will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const { startStr, endStr, durationStr } = formatEventTime(event.startTime, event.endTime);
            const isLive = isEventHappening(event.startTime, event.endTime);
            
            return (
              <div
                key={event.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  isLive
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      isLive
                        ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                        : "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                    }`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </h5>
                        <div className="flex items-center space-x-2">
                          {isLive && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                              Live
                            </span>
                          )}
                          {/* Three-State Movability Toggle */}
                          <button
                            onClick={() => updateMovabilityMutation.mutate({
                              eventId: event.id,
                              movabilityStatus: cycleMovabilityStatus(event.movabilityStatus || "unsure")
                            })}
                            className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                              event.movabilityStatus === "movable"
                                ? "bg-gradient-to-r from-green-400 to-green-500 text-white hover:from-green-500 hover:to-green-600"
                                : event.movabilityStatus === "fixed"
                                ? "bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600"
                                : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600"
                            }`}
                            disabled={updateMovabilityMutation.isPending}
                            title="Click to cycle: Fixed → Movable → Unsure → Fixed"
                          >
                            <div className={`w-3 h-3 rounded-full transition-colors ${
                              event.movabilityStatus === "movable" ? "bg-white" : 
                              event.movabilityStatus === "fixed" ? "bg-white" : "bg-white"
                            }`} />
                            <span className="font-semibold capitalize">
                              {event.movabilityStatus || "Unsure"}
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>{startStr} - {endStr}</span>
                        <span className="mx-2">•</span>
                        <span>{durationStr}</span>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}