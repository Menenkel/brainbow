import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Calendar, Send, RotateCcw, Lightbulb, Target, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SwotResponse {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actionPlan: string[];
  confidence: string;
}

export function SwotAnalysis() {
  const [fearInput, setFearInput] = useState("");
  const [swotData, setSwotData] = useState<SwotResponse | null>(null);
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { toast } = useToast();

  // Get upcoming calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: ["/api/calendar/events"],
  });

  const swotMutation = useMutation({
    mutationFn: async (situation: string) => {
      const response = await apiRequest("POST", "/api/ai/swot-analysis", { situation });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('SWOT analysis success:', data);
      console.log('Setting SWOT data to state');
      
      // Ensure arrays exist and convert objects to arrays if needed
      const processedData = {
        strengths: Array.isArray(data.strengths) ? data.strengths : Object.values(data.strengths || {}),
        weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : Object.values(data.weaknesses || {}),
        opportunities: Array.isArray(data.opportunities) ? data.opportunities : Object.values(data.opportunities || {}),
        threats: Array.isArray(data.threats) ? data.threats : Object.values(data.threats || {}),
        actionPlan: Array.isArray(data.actionPlan) ? data.actionPlan : Object.values(data.actionPlan || {}),
        confidence: data.confidence || "You have the strength to handle this challenge."
      };
      
      console.log('Processed SWOT data:', processedData);
      setSwotData(processedData);
      
      const analysisType = autoAnalyzed ? "Auto-Analysis Complete" : "SWOT Analysis Complete";
      const description = autoAnalyzed 
        ? `Fear Fighter automatically analyzed your upcoming "${nextEvent?.title}" event.`
        : "Your personalized analysis is ready to help you overcome this challenge.";
      
      toast({
        title: analysisType,
        description: description,
      });
    },
    onError: (error) => {
      console.error('SWOT analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    },
  });

  // Find the next upcoming event and auto-analyze
  useEffect(() => {
    console.log('Fear Fighter useEffect triggered with calendar events:', calendarEvents);
    
    if (calendarEvents && Array.isArray(calendarEvents) && calendarEvents.length > 0) {
      const now = new Date();
      const upcoming = calendarEvents
        .filter((event: any) => new Date(event.startTime) > now)
        .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      console.log('Upcoming events found:', upcoming.length);
      
      if (upcoming.length > 0) {
        const nextUpcoming = upcoming[0];
        console.log('Next event:', nextUpcoming.title, 'at', nextUpcoming.startTime);
        setNextEvent(nextUpcoming);
        
        // Auto-analyze the next event if conditions are met
        if (!autoAnalyzed && !swotData && !swotMutation.isPending) {
          const eventDate = new Date(nextUpcoming.startTime);
          const timeUntil = eventDate.getTime() - now.getTime();
          const hoursUntil = timeUntil / (1000 * 60 * 60);
          
          console.log('Time until event:', hoursUntil, 'hours');
          
          // Auto-analyze if event is within next 72 hours (expanded for testing)
          if (hoursUntil <= 72 && hoursUntil > 0) {
            const minutesUntil = Math.floor(timeUntil / (1000 * 60));
            let timeUntilStr = '';
            if (minutesUntil < 60) {
              timeUntilStr = `in ${minutesUntil} minutes`;
            } else if (hoursUntil < 24) {
              timeUntilStr = `in ${Math.floor(hoursUntil)} hours`;
            } else {
              timeUntilStr = `tomorrow`;
            }
            
            console.log('Auto-analyzing event:', nextUpcoming.title, 'Time until:', timeUntilStr);
            const situation = `Preparing for upcoming event: "${nextUpcoming.title}" scheduled for ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - starting ${timeUntilStr}. Please provide time-appropriate advice considering the actual time remaining.`;
            setAutoAnalyzed(true);
            swotMutation.mutate(situation);
          } else {
            console.log('Event not within 24 hours, skipping auto-analysis');
          }
        } else {
          console.log('Skipping auto-analysis:', { autoAnalyzed, hasSwotData: !!swotData, isPending: swotMutation.isPending });
        }
      } else {
        console.log('No upcoming events found');
        setNextEvent(null);
      }
    } else {
      console.log('No calendar events available');
    }
  }, [calendarEvents]);

  const handleAnalyze = () => {
    if (fearInput.trim()) {
      setAutoAnalyzed(false);
      swotMutation.mutate(fearInput.trim());
    }
  };

  const handleClear = () => {
    setFearInput("");
    setSwotData(null);
    setAutoAnalyzed(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center transform transition-transform duration-200 hover:scale-105">
            <Shield className="text-white h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-200">Fear Fighter</h3>
            <p className="text-xs text-neutral-500 dark:text-gray-400">
              {autoAnalyzed ? "Auto-analyzing your next event" : "SWOT Analysis for Anxiety"}
            </p>
          </div>
        </div>
        
        {nextEvent && (
          <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Next: {nextEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* Auto-Analysis Status */}
      {swotMutation.isPending && autoAnalyzed && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm text-purple-700 dark:text-purple-300">
              Analyzing your upcoming event...
            </span>
          </div>
        </div>
      )}

      {/* Calendar Event Selection */}
      {calendarEvents && Array.isArray(calendarEvents) && calendarEvents.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Select a calendar event to analyze:
          </label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="mb-3">
              <SelectValue placeholder="Choose an upcoming event..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom situation (type below)</SelectItem>
              {calendarEvents
                .filter((event: any) => new Date(event.startTime) > new Date())
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .slice(0, 10)
                .map((event: any) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.title} - {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {selectedEventId && selectedEventId !== "custom" && (
            <Button
              onClick={() => {
                const selectedEvent = calendarEvents.find((event: any) => event.id.toString() === selectedEventId);
                if (selectedEvent) {
                  const eventDate = new Date(selectedEvent.startTime);
                  const timeUntil = eventDate.getTime() - new Date().getTime();
                  const hoursUntil = timeUntil / (1000 * 60 * 60);
                  
                  let timeUntilStr = '';
                  if (hoursUntil < 1) {
                    timeUntilStr = `in ${Math.floor(timeUntil / (1000 * 60))} minutes`;
                  } else if (hoursUntil < 24) {
                    timeUntilStr = `in ${Math.floor(hoursUntil)} hours`;
                  } else {
                    const days = Math.floor(hoursUntil / 24);
                    timeUntilStr = `in ${days} day${days !== 1 ? 's' : ''}`;
                  }
                  
                  const situation = `Preparing for upcoming event: "${selectedEvent.title}" scheduled for ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - starting ${timeUntilStr}. ${selectedEvent.description ? `Event details: ${selectedEvent.description}. ` : ''}Please provide time-appropriate advice considering the actual time remaining.`;
                  setAutoAnalyzed(false);
                  swotMutation.mutate(situation);
                }
              }}
              disabled={swotMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {swotMutation.isPending ? "Analyzing..." : "Analyze Selected Event"}
            </Button>
          )}
        </div>
      )}

      {/* Manual Input */}
      {(!selectedEventId || selectedEventId === "custom") && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
            Or describe your own situation:
          </label>
          <Textarea
            placeholder="Describe your fear or anxiety-inducing situation..."
            value={fearInput}
            onChange={(e) => setFearInput(e.target.value)}
            className="mb-3 min-h-[80px] resize-none"
          />
          <div className="flex space-x-2">
            <Button
              onClick={handleAnalyze}
              disabled={!fearInput.trim() || swotMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {swotMutation.isPending ? "Analyzing..." : "Analyze Fear"}
            </Button>
            {swotData && (
              <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
            )}
          </div>
        </div>
      )}



      {/* SWOT Results */}
      {swotData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center mb-2">
                <Zap className="text-green-600 dark:text-green-400 h-4 w-4 mr-2" />
                <h4 className="font-semibold text-green-800 dark:text-green-300">Strengths</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                {swotData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center mb-2">
                <Lightbulb className="text-blue-600 dark:text-blue-400 h-4 w-4 mr-2" />
                <h4 className="font-semibold text-blue-800 dark:text-blue-300">Opportunities</h4>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                {swotData.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center mb-2">
                <Target className="text-yellow-600 dark:text-yellow-400 h-4 w-4 mr-2" />
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Areas to Address</h4>
              </div>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {swotData.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center mb-2">
                <AlertTriangle className="text-red-600 dark:text-red-400 h-4 w-4 mr-2" />
                <h4 className="font-semibold text-red-800 dark:text-red-300">Potential Challenges</h4>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                {swotData.threats.map((threat, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Action Plan</h4>
            <ol className="text-sm text-purple-700 dark:text-purple-400 space-y-2">
              {swotData.actionPlan.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    {typeof action === 'object' && action !== null && 'step' in action ? (
                      <>
                        <span className="font-medium">{(action as any).step}: </span>
                        <span>{(action as any).description}</span>
                      </>
                    ) : (
                      <span>{String(action)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Confidence Message */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-center text-purple-800 dark:text-purple-300 font-medium italic">
              "{swotData.confidence}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}