import { WellnessTools } from "@/components/WellnessTools";
import { RewardSystem } from "@/components/RewardSystem";
import { Navbar } from "@/components/Navbar";

export default function BreathingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Breathing & Wellness
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Guided breathing exercises and wellness tracking for daily mental health
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Breathing Tools */}
            <div className="space-y-6">
              <WellnessTools />
            </div>
            
            {/* Reward System */}
            <div className="space-y-6">
              <RewardSystem />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}