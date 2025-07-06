import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Calendar, Palette, Bell, User } from "lucide-react";
import { GoogleCalendarSync } from "@/components/GoogleCalendarSync";
import { RewardSystem } from "@/components/RewardSystem";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your Brainbow preferences and integrations</p>
        </div>

        <div className="space-y-6">
          {/* Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar Integration
              </CardTitle>
              <CardDescription>
                Connect your Google Calendar to sync events and get AI-powered planning assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleCalendarSync />
            </CardContent>
          </Card>

          {/* Reward System */}
          <RewardSystem />

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Brainbow looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme" className="text-sm font-medium">Theme</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
                </div>
                <ModeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control when and how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="calendar-reminders" className="text-sm font-medium">Calendar Reminders</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded about upcoming events</p>
                </div>
                <Switch id="calendar-reminders" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-insights" className="text-sm font-medium">Daily Insights</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive personalized wellness tips</p>
                </div>
                <Switch id="daily-insights" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="task-notifications" className="text-sm font-medium">Task Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about task deadlines</p>
                </div>
                <Switch id="task-notifications" />
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>
                <div>
                  <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    English (US)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Control your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Clear Chat History</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remove all stored conversation data</p>
                </div>
                <Button variant="outline" size="sm">Clear</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Export Data</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Download your Brainbow data</p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}