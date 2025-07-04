import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Sparkles } from "lucide-react";

const emotions = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😴", label: "Sleepy", value: "sleepy" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "🤔", label: "Thoughtful", value: "thoughtful" },
  { emoji: "💪", label: "Energetic", value: "energetic" },
  { emoji: "😐", label: "Neutral", value: "neutral" },
  { emoji: "🥱", label: "Tired", value: "tired" },
  { emoji: "😡", label: "Angry", value: "angry" },
  { emoji: "🤗", label: "Loving", value: "loving" },
];

export function EmotionalStateUpdate() {
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [emotionContext, setEmotionContext] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moodMutation = useMutation({
    mutationFn: async (moodData: {
      mood: string;
      context: string;
    }) => {
      return await apiRequest('POST', '/api/mood', moodData);
    },
    onSuccess: () => {
      toast({
        title: "Mood updated",
        description: "Your emotional state has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mood'] });
      setSelectedEmotion("");
      setEmotionContext("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save mood. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEmotionClick = (emotionValue: string) => {
    setSelectedEmotion(emotionValue);
    
    // Automatically submit when emotion is selected
    const selectedEmotionData = emotions.find(e => e.value === emotionValue);
    const contextData = {
      type: "emotional_state",
      emotion: emotionValue,
      label: selectedEmotionData?.label,
      notes: emotionContext,
      timestamp: new Date().toISOString()
    };

    moodMutation.mutate({
      mood: selectedEmotionData?.emoji || "😐",
      context: JSON.stringify(contextData)
    });
  };

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-950/50 dark:to-orange-950/50 border-pink-200 dark:border-pink-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-pink-800 dark:text-pink-200">
          <Heart className="h-5 w-5" />
          How Are You Feeling?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Current Emotional State</Label>
          <div className="grid grid-cols-4 gap-2">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleEmotionClick(emotion.value)}
                className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  selectedEmotion === emotion.value
                    ? "border-pink-500 bg-pink-100 dark:bg-pink-900/50 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600"
                }`}
              >
                <div className="text-2xl mb-1">{emotion.emoji}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {emotion.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emotion-context" className="text-sm font-medium">
            What's influencing your mood? (optional)
          </Label>
          <Textarea
            id="emotion-context"
            placeholder="Work stress, good news, weather, relationships, etc."
            value={emotionContext}
            onChange={(e) => setEmotionContext(e.target.value)}
            rows={2}
          />
        </div>

        {moodMutation.isPending && (
          <div className="text-center text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 inline mr-2" />
            Saving your emotional state...
          </div>
        )}
      </CardContent>
    </Card>
  );
}