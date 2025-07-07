import { useQuery } from "@tanstack/react-query";
import { Cloud, Sun, CloudRain, CloudSnow, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WeatherData {
  current: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    temperature: number;
    description: string;
  }>;
}

const getWeatherIcon = (description: string, size = "h-5 w-5") => {
  const desc = description.toLowerCase();
  if (desc.includes("clear") || desc.includes("sunny")) return <Sun className={`${size} text-yellow-500`} />;
  if (desc.includes("rain") || desc.includes("shower")) return <CloudRain className={`${size} text-blue-500`} />;
  if (desc.includes("snow")) return <CloudSnow className={`${size} text-gray-300`} />;
  if (desc.includes("thunder")) return <Zap className={`${size} text-purple-500`} />;
  return <Cloud className={`${size} text-gray-400`} />;
};

export function WeatherWidget() {
  const { data: weatherData, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['/api/weather'],
    queryFn: async () => {
      const response = await fetch('/api/weather');
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return response.json();
    },
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="flex items-center justify-center p-3">
          <Cloud className="h-4 w-4 animate-pulse text-blue-500 mr-2" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Loading weather...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="flex items-center justify-center p-3">
          <Cloud className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Weather unavailable</span>
        </CardContent>
      </Card>
    );
  }

  const { current, forecast } = weatherData;

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/50 dark:via-cyan-950/50 dark:to-blue-950/50 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Current Weather - Compact */}
          <div className="flex items-center gap-3">
            {getWeatherIcon(current.description)}
            <div>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {current.temperature}°C
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 capitalize">
                {current.description}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
            <div className="text-center">
              <div className="font-medium">{current.humidity}%</div>
              <div className="text-xs">Humidity</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{current.windSpeed} km/h</div>
              <div className="text-xs">Wind</div>
            </div>
          </div>

          {/* Mini Forecast */}
          <div className="flex items-center gap-2">
            {forecast.slice(1, 3).map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {index === 0 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {day.temperature}°C
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 