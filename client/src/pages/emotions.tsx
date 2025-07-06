import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

interface Mood {
  id: number;
  mood: string;
  timestamp: string;
  userId: number;
}

interface MoodStats {
  totalEntries: number;
  averageMood: number;
  moodDistribution: Record<string, number>;
  weeklyTrend: Array<{ date: string; mood: number; count: number }>;
}

const moodEmojis = ["😊", "😐", "😔", "😰", "😌"];
const moodLabels = {
  "😊": "Happy",
  "😐": "Neutral", 
  "😔": "Sad",
  "😰": "Anxious",
  "😌": "Calm"
};

const moodValues = {
  "😊": 5,
  "😌": 4,
  "😐": 3,
  "😔": 2,
  "😰": 1
};

export default function EmotionsPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moods = [], isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/mood"],
  });

  const moodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const response = await apiRequest("POST", "/api/mood", { mood });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mood recorded",
        description: "Thanks for sharing how you're feeling!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
      setSelectedMood(null);
    },
  });

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    moodMutation.mutate(mood);
  };

  // Calculate mood statistics
  const calculateMoodStats = (): MoodStats => {
    if (moods.length === 0) {
      return {
        totalEntries: 0,
        averageMood: 0,
        moodDistribution: {},
        weeklyTrend: []
      };
    }

    const distribution: Record<string, number> = {};
    const moodSum = moods.reduce((sum, mood) => {
      distribution[mood.mood] = (distribution[mood.mood] || 0) + 1;
      return sum + moodValues[mood.mood as keyof typeof moodValues];
    }, 0);

    // Calculate weekly trend (last 7 days)
    const now = new Date();
    const weeklyTrend = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayMoods = moods.filter(mood => {
        const moodDate = new Date(mood.timestamp).toISOString().split('T')[0];
        return moodDate === dateStr;
      });

      const avgMood = dayMoods.length > 0 
        ? dayMoods.reduce((sum, mood) => sum + moodValues[mood.mood as keyof typeof moodValues], 0) / dayMoods.length
        : 0;

      weeklyTrend.push({
        date: dateStr,
        mood: avgMood,
        count: dayMoods.length
      });
    }

    return {
      totalEntries: moods.length,
      averageMood: moodSum / moods.length,
      moodDistribution: distribution,
      weeklyTrend
    };
  };

  const stats = calculateMoodStats();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMoodTrendColor = (mood: number) => {
    if (mood >= 4) return "text-green-600 dark:text-green-400";
    if (mood >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMoodBarWidth = (count: number, maxCount: number) => {
    return maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 0;
  };

  const maxDistributionCount = Math.max(...Object.values(stats.moodDistribution));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Emotion Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your emotional journey and discover patterns in your mood over time</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Quick Log & Recent */}
          <div className="space-y-6">
            {/* Quick Mood Log */}
            <Card className="bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800 dark:text-gray-200">
                  Log Current Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-neutral-700 dark:text-gray-300 mb-3">How are you feeling right now?</h3>
                  <div className="flex justify-between">
                    {moodEmojis.map((mood, index) => (
                      <button
                        key={index}
                        onClick={() => handleMoodSelect(mood)}
                        className={`w-12 h-12 rounded-full hover:scale-110 transition-transform text-2xl ${
                          selectedMood === mood ? "bg-purple-200 dark:bg-purple-800 ring-2 ring-purple-500" : ""
                        }`}
                        disabled={moodMutation.isPending}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-neutral-500 dark:text-gray-400">
                      {moodMutation.isPending ? "Saving..." : "Tap an emoji to log your mood"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Moods */}
            <Card className="bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800 dark:text-gray-200">
                  Recent Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-neutral-100 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ) : moods.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 dark:text-gray-400">
                      <p className="text-sm">No mood entries yet</p>
                    </div>
                  ) : (
                    moods.slice(0, 10).map((mood) => (
                      <div key={mood.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{mood.mood}</span>
                          <div>
                            <div className="text-sm font-medium text-neutral-800 dark:text-gray-200">
                              {moodLabels[mood.mood as keyof typeof moodLabels]}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-gray-400">
                              {formatDate(mood.timestamp)} at {new Date(mood.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Statistics */}
          <div className="space-y-6">
            {/* Overview Stats */}
            <Card className="bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800 dark:text-gray-200 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalEntries}</div>
                    <div className="text-xs text-neutral-600 dark:text-gray-400">Total Entries</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : "—"}
                    </div>
                    <div className="text-xs text-neutral-600 dark:text-gray-400">Avg Mood Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Distribution */}
            <Card className="bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800 dark:text-gray-200">
                  Mood Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moodEmojis.map((emoji) => {
                    const count = stats.moodDistribution[emoji] || 0;
                    const percentage = stats.totalEntries > 0 ? (count / stats.totalEntries * 100).toFixed(1) : 0;
                    const barWidth = getMoodBarWidth(count, maxDistributionCount);
                    
                    return (
                      <div key={emoji} className="flex items-center space-x-3">
                        <span className="text-xl w-8">{emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-neutral-700 dark:text-gray-300">
                              {moodLabels[emoji as keyof typeof moodLabels]}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-gray-400">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Weekly Trend */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border-neutral-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-800 dark:text-gray-200 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  7-Day Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.weeklyTrend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-xs font-medium text-neutral-600 dark:text-gray-400">
                          {formatDate(day.date)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-neutral-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  day.mood >= 4 
                                    ? "bg-green-500" 
                                    : day.mood >= 3 
                                    ? "bg-yellow-500" 
                                    : day.mood > 0
                                    ? "bg-red-500"
                                    : "bg-gray-300"
                                }`}
                                style={{ width: `${day.mood > 0 ? (day.mood / 5) * 100 : 0}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getMoodTrendColor(day.mood)}`}>
                              {day.mood > 0 ? day.mood.toFixed(1) : "—"}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                            {day.count} {day.count === 1 ? "entry" : "entries"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.totalEntries === 0 ? (
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Start logging your moods to see personalized insights about your emotional patterns.
                    </p>
                  ) : (
                    <>
                      {stats.averageMood >= 4 && (
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            🌟 You've been maintaining great emotional balance! Keep up the positive momentum.
                          </p>
                        </div>
                      )}
                      {stats.averageMood < 3 && stats.totalEntries >= 3 && (
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            💙 Your recent mood pattern suggests you might benefit from some extra self-care. Consider trying the breathing exercises or reaching out to someone you trust.
                          </p>
                        </div>
                      )}
                      {stats.totalEntries >= 7 && (
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            📊 You've been consistently tracking your emotions. This self-awareness is a powerful tool for mental wellness.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}