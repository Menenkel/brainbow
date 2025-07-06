import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface Mood {
  id: number;
  mood: string;
  timestamp: string;
  userId: number;
  context?: string;
}

export default function Analytics() {
  const { data: moods = [], isLoading, refetch } = useQuery<Mood[]>({
    queryKey: ["/api/mood"],
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Get last 7 days of moods for weekly summary
  const getWeeklyMoodSummary = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyMoods = moods.filter(mood => 
      new Date(mood.timestamp) >= weekAgo
    );

    const moodCounts = weeklyMoods.reduce((acc, mood) => {
      acc[mood.mood] = (acc[mood.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moodCounts)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Format date and time for display
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Get emotion label from context if available
  const getEmotionLabel = (mood: Mood) => {
    try {
      if (mood.context) {
        const context = JSON.parse(mood.context);
        return context.emotion || context.label || null;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return null;
  };

  // Group moods by date for timeline view
  const getMoodsByDate = () => {
    const grouped = moods.reduce((acc, mood) => {
      const date = new Date(mood.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(mood);
      return acc;
    }, {} as Record<string, Mood[]>);

    return Object.entries(grouped)
      .map(([date, dayMoods]) => ({
        date,
        moods: dayMoods.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7); // Show last 7 days
  };

  const weeklyMoodSummary = getWeeklyMoodSummary();
  const moodsByDate = getMoodsByDate();

  // Debug logging
  console.log('Analytics page - moods data:', moods.length, 'entries');
  console.log('Latest mood entries:', moods.slice(-3));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900/20">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Emotional Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your emotional patterns and trends over time
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Summary Chart */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50 border-pink-200 dark:border-pink-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-pink-800 dark:text-pink-200">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Emotion Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyMoodSummary.length > 0 ? (
                  <div className="space-y-3">
                    {weeklyMoodSummary.slice(0, 5).map(({ emoji, count }, index) => (
                      <div key={emoji} className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{emoji}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {count} time{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(count / weeklyMoodSummary[0].count) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No mood data for the past week</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Mood Timeline */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <Calendar className="h-5 w-5" />
                  Recent Mood Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moodsByDate.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {moodsByDate.map(({ date, moods: dayMoods }) => (
                      <div key={date} className="border-l-4 border-blue-200 dark:border-blue-700 pl-4">
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="space-y-2">
                          {dayMoods.map((mood) => {
                            const { time } = formatDateTime(mood.timestamp);
                            const emotionLabel = getEmotionLabel(mood);
                            
                            return (
                              <div key={mood.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                <div className="text-xl">{mood.mood}</div>
                                <div className="flex-1">
                                  {emotionLabel && (
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                                      {emotionLabel}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {time}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No mood entries yet</p>
                    <p className="text-sm">Start tracking your emotions to see patterns and insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Mood Stats */}
        {moods.length > 0 && (
          <div className="mt-6">
            <Card className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/50 dark:to-teal-950/50 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Heart className="h-5 w-5" />
                  Emotion Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {moods.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Total Entries
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {weeklyMoodSummary.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Unique Emotions (7d)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {moodsByDate.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Active Days
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl">
                      {weeklyMoodSummary[0]?.emoji || "😌"}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Most Frequent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}