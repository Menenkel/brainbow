import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Clock, Moon } from "lucide-react";

interface Mood {
  id: number;
  mood: string;
  timestamp: string;
}

interface WellnessActivity {
  id: number;
  type: string;
  completed: boolean;
  timestamp: string;
}

export function DailyInsights() {
  const { data: moods = [] } = useQuery<Mood[]>({
    queryKey: ["/api/mood"],
  });

  const { data: activities = [] } = useQuery<WellnessActivity[]>({
    queryKey: ["/api/wellness/activities"],
  });

  const { data: todayEvents = [] } = useQuery({
    queryKey: ["/api/calendar/events/today"],
  });

  // Calculate stress level based on calendar density and mood
  const calculateStressLevel = () => {
    const eventCount = (todayEvents as any[]).length;
    const recentMood = moods[0]?.mood;
    
    let stressScore = 0;
    
    // Factor in calendar density
    if (eventCount > 5) stressScore += 3;
    else if (eventCount > 3) stressScore += 2;
    else if (eventCount > 1) stressScore += 1;
    
    // Factor in mood
    const moodScores: Record<string, number> = {
      "😰": 3, // anxious
      "😔": 2, // sad
      "😐": 1, // neutral
      "😊": 0, // happy
      "😌": 0, // calm
    };
    
    if (recentMood && moodScores[recentMood] !== undefined) {
      stressScore += moodScores[recentMood];
    }
    
    if (stressScore >= 4) return { level: "High", width: "w-4/5", color: "bg-red-400" };
    if (stressScore >= 2) return { level: "Moderate", width: "w-3/5", color: "bg-gradient-to-r from-secondary via-accent to-red-400" };
    return { level: "Low", width: "w-2/5", color: "bg-secondary" };
  };

  // Calculate productivity score based on completed activities and mood
  const calculateProductivityScore = () => {
    const completedActivities = activities.filter(a => a.completed).length;
    const totalActivities = activities.length;
    const baseScore = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 75;
    
    // Adjust based on recent mood
    const recentMood = moods[0]?.mood;
    let adjustment = 0;
    
    if (recentMood === "😊" || recentMood === "😌") adjustment = 10;
    else if (recentMood === "😔" || recentMood === "😰") adjustment = -10;
    
    return Math.max(0, Math.min(100, Math.round(baseScore + adjustment)));
  };

  // Calculate wellness score based on wellness activities
  const calculateWellnessScore = () => {
    const wellnessActivities = activities.filter(a => 
      a.type === "breathing" || a.type === "meditation" || a.type === "affirmation"
    );
    const completedWellness = wellnessActivities.filter(a => a.completed).length;
    
    let baseScore = 70; // Default baseline
    baseScore += completedWellness * 15; // Boost for completed wellness activities
    
    // Factor in recent mood
    const recentMood = moods[0]?.mood;
    if (recentMood === "😌" || recentMood === "😊") baseScore += 15;
    else if (recentMood === "😰" || recentMood === "😔") baseScore -= 15;
    
    return Math.max(0, Math.min(100, baseScore));
  };

  const stressData = calculateStressLevel();
  const productivityScore = calculateProductivityScore();
  const wellnessScore = calculateWellnessScore();

  const recommendations = [
    {
      icon: <Lightbulb className="text-white h-3 w-3" />,
      color: "bg-accent",
      text: "Schedule a 10-minute break before your next important meeting to practice deep breathing."
    },
    {
      icon: <Clock className="text-white h-3 w-3" />,
      color: "bg-secondary",
      text: "Your energy peaks are typically in the morning - consider scheduling important tasks then."
    },
    {
      icon: <Moon className="text-white h-3 w-3" />,
      color: "bg-primary",
      text: "Try ending your day with a 5-minute gratitude reflection for better sleep quality."
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-200 mb-4">Daily Insights</h3>
      
      {/* Stress Level Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Current Stress Level</span>
          <span className="text-sm text-accent font-semibold">{stressData.level}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div className={`${stressData.color} h-2 rounded-full ${stressData.width}`}></div>
        </div>
        <p className="text-xs text-neutral-500 mt-1">Based on calendar density and mood tracking</p>
      </div>

      {/* Productivity Score */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-primary/10 rounded-xl">
          <div className="text-2xl font-bold text-primary">{productivityScore}%</div>
          <div className="text-xs text-neutral-600">Productivity</div>
        </div>
        <div className="text-center p-3 bg-secondary/10 rounded-xl">
          <div className="text-2xl font-bold text-secondary">{wellnessScore}%</div>
          <div className="text-xs text-neutral-600">Wellness</div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-3">
        <h4 className="font-medium text-neutral-800 text-sm">AI Recommendations</h4>
        
        {recommendations.map((rec, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
            <div className={`w-6 h-6 ${rec.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {rec.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-700">{rec.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
