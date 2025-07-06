import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, AlertCircle, Plus, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalendarIntegration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Manage your calendar events and schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              <Clock className="h-3 w-3 mr-1" />
              Manual Entry
            </Badge>
          </div>
        </div>

        <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Ready for Google Calendar Sync!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your Google Calendar credentials are configured. To enable sync, you need to set up testing mode in Google Cloud Console.
              </p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-green-200 dark:border-green-800 space-y-3">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Quick Setup (5 minutes):
              </p>
              <ol className="text-sm text-green-700 dark:text-green-300 list-decimal list-inside space-y-1">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google Cloud Console</a></li>
                <li>Navigate to "OAuth consent screen"</li>
                <li>Add your Gmail address as a "Test user"</li>
                <li>Save and return here to try sync</li>
              </ol>
            </div>
            
            <Button 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open("https://console.cloud.google.com/apis/credentials/consent", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Setup Test User Access
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}