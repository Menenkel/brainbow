import { SwotAnalysis } from "@/components/SwotAnalysis";
import { Navbar } from "@/components/Navbar";

export default function FearFighterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fear Fighter</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Transform your anxieties into actionable insights using AI-powered SWOT analysis.
            Identify your strengths, weaknesses, opportunities, and threats to overcome challenges.
          </p>
        </div>
        
        <SwotAnalysis />
      </div>
    </div>
  );
}