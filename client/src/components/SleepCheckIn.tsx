import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Moon, Clock, CheckCircle } from "lucide-react";

interface SleepData {
  id: number;
  userId: number;
  date: string;
  sleepQuality: string;
  sleepHours: number;
  wakeUpTime?: string;
  notes?: string;
  createdAt: string;
}

export function SleepCheckIn() {
  const [sleepQuality, setSleepQuality] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [wakeUpTime, setWakeUpTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's sleep data
  const { data: todaySleepData, isLoading } = useQuery<SleepData | null>({
    queryKey: ['/api/sleep/today'],
    queryFn: async () => {
      const response = await fetch('/api/sleep/today');
      if (!response.ok) {
        throw new Error('Failed to fetch sleep data');
      }
      return response.json();
    }
  });

  // Set form values when data is loaded
  useState(() => {
    if (todaySleepData) {
      setSleepQuality(todaySleepData.sleepQuality);
      setSleepHours(todaySleepData.sleepHours.toString());
      setWakeUpTime(todaySleepData.wakeUpTime || "");
      setNotes(todaySleepData.notes || "");
    }
  });

  const sleepMutation = useMutation({
    mutationFn: async (sleepData: {
      date: string;
      sleepQuality: string;
      sleepHours: number;
      wakeUpTime?: string;
      notes?: string;
    }) => {
      return await apiRequest('POST', '/api/sleep', sleepData);
    },
    onSuccess: () => {
      toast({
        title: "Sleep data saved",
        description: "Your sleep information has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sleep/today'] });
      setIsMinimized(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save sleep data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!sleepQuality || !sleepHours) {
      toast({
        title: "Missing information",
        description: "Please fill in sleep quality and hours.",
        variant: "destructive",
      });
      return;
    }

    sleepMutation.mutate({
      date: today,
      sleepQuality,
      sleepHours: parseInt(sleepHours),
      wakeUpTime: wakeUpTime || undefined,
      notes: notes || undefined
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const alreadyCompleted = todaySleepData !== null;

  // Show minimized view after completion
  if (isMinimized || alreadyCompleted) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Sleep Check-In
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-8 px-2 text-xs"
            >
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>✓ Quality: {todaySleepData?.sleepQuality || sleepQuality}</p>
            <p>✓ Hours: {todaySleepData?.sleepHours || sleepHours}</p>
            {(todaySleepData?.wakeUpTime || wakeUpTime) && (
              <p>✓ Wake Time: {todaySleepData?.wakeUpTime || wakeUpTime}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Moon className="h-5 w-5" />
          Sleep Check-In
          {alreadyCompleted && (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alreadyCompleted && (
          <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Sleep data recorded for today. You can update it below if needed.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="sleep-quality" className="text-sm font-medium">
            Sleep Quality
          </Label>
          <Select value={sleepQuality} onValueChange={setSleepQuality}>
            <SelectTrigger>
              <SelectValue placeholder="How was your sleep?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent - Felt completely rested</SelectItem>
              <SelectItem value="good">Good - Woke up refreshed</SelectItem>
              <SelectItem value="fair">Fair - Some tiredness remaining</SelectItem>
              <SelectItem value="poor">Poor - Very tired, restless night</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sleep-hours" className="text-sm font-medium">
            Sleep Duration (hours)
          </Label>
          <Input
            id="sleep-hours"
            type="number"
            min="1"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            placeholder="e.g., 7.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wake-time" className="text-sm font-medium">
            Wake Up Time (optional)
          </Label>
          <Input
            id="wake-time"
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Sleep Notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any observations about your sleep? Dreams, interruptions, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={sleepMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          {sleepMutation.isPending ? (
            "Saving..."
          ) : alreadyCompleted ? (
            "Update Sleep Data"
          ) : (
            "Save Sleep Data"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}