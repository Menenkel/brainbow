import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Wind, Heart, RotateCcw, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function WellnessTools() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "pause">("inhale");
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingProgress, setBreathingProgress] = useState(0);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const { toast } = useToast();

  // Get today's breathing exercises
  const { data: wellnessActivities } = useQuery({
    queryKey: ["/api/wellness/activities"],
  });

  const todayBreathingCount = Array.isArray(wellnessActivities) 
    ? wellnessActivities.filter((activity: any) => {
        const activityDate = new Date(activity.timestamp).toDateString();
        const today = new Date().toDateString();
        return activity.type === "breathing" && activityDate === today;
      }).length 
    : 0;

  // Get reward settings from localStorage
  const rewardSettings = JSON.parse(localStorage.getItem('rewardSettings') || '{"dailyBreathingGoal": 5, "enableBreathingRewards": true}');
  const isGoalReached = todayBreathingCount >= rewardSettings.dailyBreathingGoal;

  const { data: affirmationData, refetch: refetchAffirmation } = useQuery({
    queryKey: ["/api/ai/affirmation"],
    enabled: false,
  });

  const breathingMutation = useMutation({
    mutationFn: async (data: { type: string; duration: number; completed: boolean }) => {
      const response = await apiRequest("POST", "/api/wellness/activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/activities"] });
      
      // Check if this completes the daily breathing goal
      const newCount = todayBreathingCount + 1;
      if (rewardSettings.enableBreathingRewards && newCount === rewardSettings.dailyBreathingGoal) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 4000);
        
        // Mark the reward as achieved today to prevent duplicate notifications
        const today = new Date().toDateString();
        localStorage.setItem('lastBreathingReward', today);
        
        toast({
          title: "🎉 Daily Breathing Goal Achieved!",
          description: `Amazing! You've completed ${rewardSettings.dailyBreathingGoal} breathing exercises today. Your mind and body thank you!`,
          duration: 6000,
        });
      } else if (newCount < rewardSettings.dailyBreathingGoal) {
        const remaining = rewardSettings.dailyBreathingGoal - newCount;
        toast({
          title: "Great work! 🌟",
          description: `${remaining} more exercise${remaining !== 1 ? 's' : ''} to reach your daily goal!`,
          duration: 3000,
        });
      }
    },
  });

  const affirmationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/ai/affirmation");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Daily Affirmation",
        description: data.affirmation,
        duration: 8000,
      });
    },
  });

  // 4-7-8 Breathing pattern
  const breathingPattern = {
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 2,
  };

  const startBreathingExercise = () => {
    setIsBreathing(true);
    setBreathingPhase("inhale");
    setBreathingTimer(breathingPattern.inhale);
    setBreathingProgress(0);
    setBreathingCycle(0);
    
    breathingMutation.mutate({
      type: "breathing",
      duration: 240, // 4 minutes
      completed: false,
    });
  };

  const stopBreathingExercise = () => {
    setIsBreathing(false);
    setBreathingTimer(0);
    setBreathingProgress(0);
    
    breathingMutation.mutate({
      type: "breathing",
      duration: breathingCycle * 21, // approximate duration
      completed: true,
    });

    toast({
      title: "Breathing exercise completed!",
      description: "Great job taking care of your mental health.",
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isBreathing && breathingTimer > 0) {
      interval = setInterval(() => {
        setBreathingTimer((prev) => {
          const newTimer = prev - 1;
          const totalPhaseTime = breathingPattern[breathingPhase];
          const progress = ((totalPhaseTime - newTimer) / totalPhaseTime) * 100;
          setBreathingProgress(progress);
          
          return newTimer;
        });
      }, 1000);
    } else if (isBreathing && breathingTimer === 0) {
      // Move to next phase
      const phases: Array<keyof typeof breathingPattern> = ["inhale", "hold", "exhale", "pause"];
      const currentIndex = phases.indexOf(breathingPhase);
      const nextPhase = phases[(currentIndex + 1) % phases.length];
      
      setBreathingPhase(nextPhase);
      setBreathingTimer(breathingPattern[nextPhase]);
      
      if (nextPhase === "inhale") {
        setBreathingCycle((prev) => {
          const newCycle = prev + 1;
          if (newCycle >= 8) { // 8 cycles ≈ 3 minutes
            stopBreathingExercise();
          }
          return newCycle;
        });
      }
    }

    return () => clearInterval(interval);
  }, [isBreathing, breathingTimer, breathingPhase]);

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      case "pause":
        return "Pause";
      default:
        return "Breathe";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-200">Wellness Tools</h3>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
            isGoalReached 
              ? 'bg-yellow-100 dark:bg-yellow-900' 
              : 'bg-green-100 dark:bg-green-900'
          }`}>
            {isGoalReached ? (
              <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <Heart className="w-3 h-3 text-green-600 dark:text-green-400" />
            )}
            <span className={`text-xs font-medium ${
              isGoalReached 
                ? 'text-yellow-700 dark:text-yellow-300' 
                : 'text-green-700 dark:text-green-300'
            }`}>
              {todayBreathingCount}/{rewardSettings.dailyBreathingGoal} today
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
            <span className="text-xs text-secondary font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Reward Animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-6xl mb-2">🎉</div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span className="font-bold">Daily Goal Complete!</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breathing Exercise */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
        <div className="text-center">
          {/* Breathing Circle Visualization */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            
            {/* Animated Breathing Circle */}
            <div className={`absolute inset-2 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center transition-all duration-1000 ${
              isBreathing && breathingPhase === "inhale" ? "scale-110 shadow-lg" : 
              isBreathing && breathingPhase === "exhale" ? "scale-90 shadow-sm" : 
              "scale-100 shadow-md hover:scale-105"
            }`}>
              <Wind className={`text-white h-8 w-8 transition-all duration-1000 ${
                isBreathing && breathingPhase === "inhale" ? "scale-110" : 
                isBreathing && breathingPhase === "exhale" ? "scale-90" : 
                "scale-100"
              }`} />
            </div>
            
            {/* Progress Ring */}
            {isBreathing && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-primary transition-all duration-300"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 48}`,
                    strokeDashoffset: `${2 * Math.PI * 48 * (1 - breathingProgress / 100)}`,
                  }}
                />
              </svg>
            )}
          </div>
          <h4 className="font-semibold text-neutral-800 mb-2">4-7-8 Breathing</h4>
          <p className="text-sm text-neutral-600 mb-4">
            {isBreathing ? "Perfect for calming your mind" : "Perfect for pre-presentation calm"}
          </p>
          
          {/* Breathing Instructions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-primary/10">
            <div className={`text-3xl font-bold mb-2 transition-all duration-500 ${
              breathingPhase === "inhale" ? "text-blue-600 scale-105" :
              breathingPhase === "hold" ? "text-purple-600 scale-110" :
              breathingPhase === "exhale" ? "text-green-600 scale-105" :
              "text-primary"
            }`}>
              {isBreathing ? getBreathingInstruction() : "4-7-8 Breathing"}
            </div>
            
            {isBreathing ? (
              <div className="space-y-2">
                <div className={`text-lg font-medium transition-colors duration-500 ${
                  breathingPhase === "inhale" ? "text-blue-500" :
                  breathingPhase === "hold" ? "text-purple-500" :
                  breathingPhase === "exhale" ? "text-green-500" :
                  "text-neutral-600"
                }`}>
                  {breathingPhase === "inhale" && "Breathe in slowly through your nose"}
                  {breathingPhase === "hold" && "Hold your breath gently"}  
                  {breathingPhase === "exhale" && "Exhale completely through your mouth"}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-mono text-primary">
                    {breathingTimer}s
                  </div>
                  <div className="text-sm text-neutral-500">
                    Cycle {breathingCycle + 1} of 8
                  </div>
                </div>
                

              </div>
            ) : (
              <div className="text-center text-neutral-600">
                <div className="text-sm mb-2">Inhale for 4s • Hold for 7s • Exhale for 8s</div>
                <div className="text-xs text-neutral-500">8 cycles for optimal relaxation</div>
              </div>
            )}
          </div>
          
          <Button
            onClick={isBreathing ? stopBreathingExercise : startBreathingExercise}
            disabled={breathingMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {isBreathing ? (
              <>
                <span className="mr-2">⏹️</span>
                Stop Session
              </>
            ) : (
              <>
                <span className="mr-2">▶️</span>
                Start Session
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Daily Affirmation */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
        <div className="text-center">
          <Heart className="text-secondary h-8 w-8 mx-auto mb-3" />
          <h4 className="font-semibold text-neutral-800 dark:text-gray-200 mb-2">Today's Affirmation</h4>
          <blockquote className="text-sm text-neutral-700 dark:text-gray-300 italic mb-3 min-h-[2.5rem] flex items-center justify-center">
            {(affirmationData as any)?.affirmation || 
             (affirmationMutation.data as any)?.affirmation || 
             "I am prepared, confident, and capable of handling any challenge that comes my way."}
          </blockquote>
          <Button
            onClick={() => affirmationMutation.mutate()}
            disabled={affirmationMutation.isPending}
            variant="ghost"
            size="sm"
            className="text-secondary hover:text-secondary/80 hover:bg-secondary/10"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            {affirmationMutation.isPending ? "Loading..." : "New Affirmation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
