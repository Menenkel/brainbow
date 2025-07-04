import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus, ExternalLink } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: string;
  isMovable?: boolean;
}

export function DailyCalendarView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events'],
  });

  const toggleMovableMutation = useMutation({
    mutationFn: async ({ eventId, isMovable }: { eventId: number; isMovable: boolean }) => {
      const response = await apiRequest("PATCH", `/api/calendar/events/${eventId}`, {
        isMovable
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
      console.error("Toggle movable error:", error);
      toast({
        title: "Update Failed",
        description: "Could not update event preference.",
        variant: "destructive",
      });
    },
  });

  // Filter events for the selected date
  const dailyEvents = events.filter(event => {
    const eventDate = parseISO(event.startTime);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Sort events by start time
  const sortedEvents = dailyEvents.sort((a, b) => 
    parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
  );

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

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'EEEE, MMM d');
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'google-calendar':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Calendar
            </CardTitle>
            <CardDescription>
              {formatEventDate(selectedDate.toISOString())} • {sortedEvents.length} events
              <span className="text-xs text-gray-500 ml-2">
                ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
              ←
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedDate(new Date())}
              disabled={isToday(selectedDate)}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No events scheduled for {formatEventDate(selectedDate.toISOString()).toLowerCase()}
            </p>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className={getEventTypeColor(event.type)}>
                        {event.type === 'google-calendar' ? 'Google' : event.type}
                      </Badge>
                      {/* Movable Toggle - enhanced design */}
                      <button
                        onClick={() => toggleMovableMutation.mutate({
                          eventId: event.id,
                          isMovable: !event.isMovable
                        })}
                        className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                          event.isMovable
                            ? "bg-gradient-to-r from-green-400 to-green-500 text-white hover:from-green-500 hover:to-green-600"
                            : "bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600"
                        }`}
                        disabled={toggleMovableMutation.isPending}
                        title={event.type === "google-calendar" ? "Mark Google Calendar event as movable for AI planning" : "Toggle whether this event can be rescheduled"}
                      >
                        <div className={`w-3 h-3 rounded-full transition-colors ${
                          event.isMovable ? "bg-white" : "bg-gray-200"
                        }`} />
                        <span className="font-semibold">
                          {event.isMovable ? "Movable" : "Fixed"}
                        </span>
                      </button>
                      {event.type === 'google-calendar' && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}