import { Brain, Calendar, Shield, Settings, BarChart3, Home, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/breathing", label: "Breathing", icon: Heart },
    { path: "/fear-fighter", label: "Fear Fighter", icon: Shield },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-neutral-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 md:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer group">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center transform transition-transform duration-200 group-hover:scale-105 group-hover:rotate-3">
                <Brain className="text-white h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-semibold text-neutral-800 dark:text-gray-200">Brainbow</h1>
                <p className="text-xs text-neutral-500 dark:text-gray-400 hidden md:block">AI-Powered Wellness Planning</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 transform transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                  >
                    <Icon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right side - Theme toggle */}
          <div className="flex items-center space-x-4">
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Navigation - Compact Grid */}
        <div className="md:hidden border-t border-neutral-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="h-12 w-full flex flex-col items-center justify-center gap-1 text-xs"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}