import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Cloud, Thermometer, Droplets, Wind, Bed, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  description: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  code: number;
}

interface CheckInData {
  sleepQuality: string;
  sleepHours: number;
  wakeUpTime: string;
  weather: WeatherData;
  evaluationId: number;
}

export function DailyCheckIn() {
  const [sleepQuality, setSleepQuality] = useState<string>("");
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [wakeUpTime, setWakeUpTime] = useState<string>("");
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [evaluationComplete, setEvaluationComplete] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if evaluation was already completed today
  useEffect(() => {
    const lastEvaluation = localStorage.getItem('lastMorningEvaluation');
    const today = new Date().toDateString();
    
    if (lastEvaluation === today) {
      setEvaluationComplete(true);
    }

    // Set default wake up time to current time
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    setWakeUpTime(currentTime);
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Access",
            description: "Please enable location access for weather updates, or we'll use a default location.",
            variant: "destructive"
          });
          // Use default location (San Francisco)
          setLocation({ lat: 37.7749, lon: -122.4194 });
        }
      );
    } else {
      // Use default location if geolocation not supported
      setLocation({ lat: 37.7749, lon: -122.4194 });
    }
  }, []);

  const morningEvaluationMutation = useMutation({
    mutationFn: async (data: {
      lat: number;
      lon: number;
      sleepQuality: string;
      sleepHours: number;
      wakeUpTime: string;
    }) => {
      const response = await apiRequest("POST", "/api/morning-evaluation", data);
      return response.json();
    },
    onSuccess: (data: CheckInData) => {
      setWeatherData(data.weather);
      setEvaluationComplete(true);
      
      // Store completion in localStorage
      const today = new Date().toDateString();
      localStorage.setItem('lastMorningEvaluation', today);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      
      toast({
        title: "Good Morning! 🌅",
        description: `Your morning evaluation is complete. Weather: ${data.weather.description}, ${data.weather.temperature}°C`,
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("Morning evaluation error:", error);
      toast({
        title: "Evaluation Failed",
        description: "Could not complete morning evaluation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!location || !sleepQuality) {
      toast({
        title: "Missing Information",
        description: "Please provide sleep quality and allow location access.",
        variant: "destructive",
      });
      return;
    }

    morningEvaluationMutation.mutate({
      lat: location.lat,
      lon: location.lon,
      sleepQuality,
      sleepHours,
      wakeUpTime,
    });
  };

  const handleStartNewDay = () => {
    setEvaluationComplete(false);
    setSleepQuality("");
    setSleepHours(8);
    setWeatherData(null);
    localStorage.removeItem('lastMorningEvaluation');
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌤️";
  };

  const getSleepQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent": return "text-green-600 dark:text-green-400";
      case "good": return "text-blue-600 dark:text-blue-400";
      case "fair": return "text-yellow-600 dark:text-yellow-400";
      case "poor": return "text-red-600 dark:text-red-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  if (evaluationComplete) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 border-orange-200 dark:border-orange-700">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Heart className="h-6 w-6 text-orange-500" />
            <span>Check-In Complete!</span>
          </CardTitle>
          <CardDescription>Ready to help AI optimize your schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={() => setEvaluationComplete(false)}
              variant="outline"
              size="sm"
              className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <Heart className="mr-2 h-4 w-4" />
              Start New Check-In
            </Button>
          </div>
          {weatherData && (
            <div className="flex items-center justify-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-3xl">{getWeatherIcon(weatherData.code)}</div>
              <div className="text-center">
                <div className="font-semibold text-lg">{weatherData.description}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {weatherData.temperature}°C • {weatherData.humidity}% humidity
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-semibold">Sleep Quality</div>
              <div className={`text-sm ${getSleepQualityColor(sleepQuality)}`}>
                {sleepQuality.charAt(0).toUpperCase() + sleepQuality.slice(1)}
              </div>
            </div>
            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="font-semibold">Sleep Hours</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {sleepHours} hours
              </div>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={handleStartNewDay}
              className="text-sm"
            >
              Start New Evaluation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 border-orange-200 dark:border-orange-700">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Heart className="h-6 w-6 text-orange-500" />
          <span>Daily Check-In</span>
        </CardTitle>
        <CardDescription>
          Quick check-in to track your wellness and help AI plan your day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sleep Quality */}
          <div className="space-y-2">
            <Label htmlFor="sleep-quality" className="flex items-center space-x-2">
              <Bed className="h-4 w-4" />
              <span>How was your sleep?</span>
            </Label>
            <Select value={sleepQuality} onValueChange={setSleepQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Select sleep quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">😴 Excellent - Refreshed and energized</SelectItem>
                <SelectItem value="good">😊 Good - Rested and ready</SelectItem>
                <SelectItem value="fair">😐 Fair - Okay but could be better</SelectItem>
                <SelectItem value="poor">😞 Poor - Tired and groggy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sleep Hours */}
          <div className="space-y-2">
            <Label htmlFor="sleep-hours" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Hours of sleep</span>
            </Label>
            <Input
              id="sleep-hours"
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              min="1"
              max="12"
              step="0.5"
            />
          </div>
        </div>

        {/* Wake Up Time */}
        <div className="space-y-2">
          <Label htmlFor="wake-time" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>What time did you wake up?</span>
          </Label>
          <Input
            id="wake-time"
            type="time"
            value={wakeUpTime}
            onChange={(e) => setWakeUpTime(e.target.value)}
          />
        </div>

        {/* Location Status */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>
            {location ? "Location detected for weather" : "Detecting location..."}
          </span>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!sleepQuality || !location || morningEvaluationMutation.isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600"
        >
          {morningEvaluationMutation.isPending ? (
            <>
              <Cloud className="mr-2 h-4 w-4 animate-spin" />
              Getting Weather & Saving...
            </>
          ) : (
            <>
              <Heart className="mr-2 h-4 w-4" />
              Complete Daily Check-In
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}