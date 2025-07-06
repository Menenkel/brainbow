import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Target, Clock, Smartphone, Zap, Gift } from "lucide-react";

interface RewardSettings {
  dailyBreathingGoal: number;
  socialMediaWakeupHours: number;
  socialMediaBedtimeHours: number;
  enableBreathingRewards: boolean;
  enableSocialMediaRewards: boolean;
  breathingStreakDays: number;
  socialMediaStreakDays: number;
}

interface TodayProgress {
  breathingExercises: number;
  socialMediaMorningCompleted: boolean;
  socialMediaEveningCompleted: boolean;
  lastBreathingTime: string | null;
  wakeupTime: string | null;
  bedtimeGoal: string | null;
}

export function RewardSystem() {
  const [settings, setSettings] = useState<RewardSettings>({
    dailyBreathingGoal: 5,
    socialMediaWakeupHours: 1,
    socialMediaBedtimeHours: 1,
    enableBreathingRewards: true,
    enableSocialMediaRewards: true,
    breathingStreakDays: 0,
    socialMediaStreakDays: 0,
  });
  
  const [todayProgress, setTodayProgress] = useState<TodayProgress>({
    breathingExercises: 0,
    socialMediaMorningCompleted: false,
    socialMediaEveningCompleted: false,
    lastBreathingTime: null,
    wakeupTime: null,
    bedtimeGoal: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today's wellness activities to track breathing exercises
  const { data: wellnessActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/wellness/activities"],
  });

  // Count breathing exercises for today
  useEffect(() => {
    const today = new Date().toDateString();
    const todayBreathing = (wellnessActivities as any[]).filter((activity: any) => 
      activity.type === 'breathing' && 
      new Date(activity.timestamp).toDateString() === today
    );
    
    setTodayProgress(prev => ({
      ...prev,
      breathingExercises: todayBreathing.length,
      lastBreathingTime: todayBreathing.length > 0 ? todayBreathing[todayBreathing.length - 1].timestamp : null
    }));
  }, [wellnessActivities]);

  // Check for breathing goal completion
  useEffect(() => {
    if (settings.enableBreathingRewards && todayProgress.breathingExercises >= settings.dailyBreathingGoal) {
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('lastBreathingReward');
      
      if (savedDate !== today) {
        localStorage.setItem('lastBreathingReward', today);
        toast({
          title: "🎉 Breathing Goal Achieved!",
          description: `Amazing! You've completed ${settings.dailyBreathingGoal} breathing exercises today. Your mind and body thank you!`,
        });
      }
    }
  }, [todayProgress.breathingExercises, settings]);

  const saveSettings = useMutation({
    mutationFn: async (newSettings: RewardSettings) => {
      localStorage.setItem('rewardSettings', JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your reward preferences have been updated.",
      });
    },
  });

  const markSocialMediaProgress = useMutation({
    mutationFn: async (type: 'morning' | 'evening') => {
      const today = new Date().toDateString();
      const key = type === 'morning' ? 'socialMediaMorning' : 'socialMediaEvening';
      localStorage.setItem(`${key}_${today}`, 'completed');
      return type;
    },
    onSuccess: (type) => {
      setTodayProgress(prev => ({
        ...prev,
        [type === 'morning' ? 'socialMediaMorningCompleted' : 'socialMediaEveningCompleted']: true
      }));
      
      toast({
        title: type === 'morning' ? "🌅 Morning Social Media Break Complete!" : "🌙 Evening Social Media Break Complete!",
        description: `Great job staying focused ${type === 'morning' ? 'after waking up' : 'before bedtime'}! Your digital wellness is improving.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/activities"] });
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rewardSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    // Check today's social media progress
    const today = new Date().toDateString();
    const morningCompleted = localStorage.getItem(`socialMediaMorning_${today}`) === 'completed';
    const eveningCompleted = localStorage.getItem(`socialMediaEvening_${today}`) === 'completed';
    
    setTodayProgress(prev => ({
      ...prev,
      socialMediaMorningCompleted: morningCompleted,
      socialMediaEveningCompleted: eveningCompleted
    }));
  }, []);

  const breathingProgress = Math.min((todayProgress.breathingExercises / settings.dailyBreathingGoal) * 100, 100);
  const breathingGoalMet = todayProgress.breathingExercises >= settings.dailyBreathingGoal;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reward System</h2>
        <p className="text-gray-600 dark:text-gray-400">Track your wellness goals and earn daily rewards</p>
      </div>

      {/* Today's Progress */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Today's Progress
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Breathing Exercises */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Breathing Exercises</span>
              {breathingGoalMet && <Star className="w-5 h-5 text-yellow-500" />}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">{todayProgress.breathingExercises}</span>
              <span className="text-gray-500 dark:text-gray-400">/ {settings.dailyBreathingGoal}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${breathingProgress}%` }}
              ></div>
            </div>
            {breathingGoalMet && (
              <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Gift className="w-3 h-3 mr-1" />
                Goal Complete!
              </Badge>
            )}
          </div>

          {/* Social Media Breaks */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Media Breaks</span>
              {todayProgress.socialMediaMorningCompleted && todayProgress.socialMediaEveningCompleted && 
                <Star className="w-5 h-5 text-yellow-500" />
              }
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Morning ({settings.socialMediaWakeupHours}h)</span>
                {todayProgress.socialMediaMorningCompleted ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✓ Done
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => markSocialMediaProgress.mutate('morning')}
                    className="text-xs"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Evening ({settings.socialMediaBedtimeHours}h)</span>
                {todayProgress.socialMediaEveningCompleted ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✓ Done
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => markSocialMediaProgress.mutate('evening')}
                    className="text-xs"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reward Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          Reward Settings
        </h3>
        
        <div className="space-y-6">
          {/* Breathing Exercise Rewards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Breathing Exercise Rewards</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get celebrated for completing daily breathing exercises</p>
              </div>
              <Switch
                checked={settings.enableBreathingRewards}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings, enableBreathingRewards: checked };
                  setSettings(newSettings);
                  saveSettings.mutate(newSettings);
                }}
              />
            </div>
            
            {settings.enableBreathingRewards && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="breathing-goal" className="text-sm">Daily Goal</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="breathing-goal"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.dailyBreathingGoal}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 5;
                      const newSettings = { ...settings, dailyBreathingGoal: Math.max(1, Math.min(20, value)) };
                      setSettings(newSettings);
                      saveSettings.mutate(newSettings);
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">exercises per day</span>
                </div>
              </div>
            )}
          </div>

          {/* Social Media Break Rewards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Social Media Break Rewards</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get rewarded for staying off social media after waking up and before bed</p>
              </div>
              <Switch
                checked={settings.enableSocialMediaRewards}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings, enableSocialMediaRewards: checked };
                  setSettings(newSettings);
                  saveSettings.mutate(newSettings);
                }}
              />
            </div>
            
            {settings.enableSocialMediaRewards && (
              <div className="ml-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wakeup-hours" className="text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Morning break duration
                    </Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="wakeup-hours"
                        type="number"
                        min="0.5"
                        max="4"
                        step="0.5"
                        value={settings.socialMediaWakeupHours}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 1;
                          const newSettings = { ...settings, socialMediaWakeupHours: Math.max(0.5, Math.min(4, value)) };
                          setSettings(newSettings);
                          saveSettings.mutate(newSettings);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">hours after waking</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bedtime-hours" className="text-sm flex items-center">
                      <Smartphone className="w-4 h-4 mr-1" />
                      Evening break duration
                    </Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="bedtime-hours"
                        type="number"
                        min="0.5"
                        max="4"
                        step="0.5"
                        value={settings.socialMediaBedtimeHours}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 1;
                          const newSettings = { ...settings, socialMediaBedtimeHours: Math.max(0.5, Math.min(4, value)) };
                          setSettings(newSettings);
                          saveSettings.mutate(newSettings);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">hours before bed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}