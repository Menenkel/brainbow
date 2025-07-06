import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarStatus {
  configured: boolean;
  authenticated?: boolean;
}

interface SyncResult {
  synced: number;
  total: number;
  deleted: number;
  message: string;
  events: Array<{
    id: number;
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

export function GoogleCalendarSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [authCode, setAuthCode] = useState("");

  const { data: status, isLoading: statusLoading } = useQuery<GoogleCalendarStatus>({
    queryKey: ['/api/google-calendar/status'],
  });

  const { data: authUrl } = useQuery<{ authUrl: string }>({
    queryKey: ['/api/google-calendar/auth-url'],
    enabled: isSetupMode,
  });

  const authMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/google-calendar/authorize', {
        authCode: authCode.trim()
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Authorization Successful",
        description: "Google Calendar has been connected successfully!",
      });
      setIsSetupMode(false);
      setAuthCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/status'] });
    },
    onError: (error) => {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize Google Calendar",
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      const response = await apiRequest('POST', '/api/google-calendar/sync', {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
      return await response.json();
    },
    onSuccess: (data: SyncResult) => {
      const baseMessage = `Synced ${data.synced} events from Google Calendar`;
      const fullMessage = data.deleted > 0 
        ? `${baseMessage}. Removed ${data.deleted} deleted events.`
        : baseMessage;
      
      toast({
        title: "Calendar Synced",
        description: fullMessage,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed", 
        description: error.message?.includes('authentication') || error.message?.includes('Authentication') 
          ? "Please complete Google Calendar setup first"
          : error.message || "Failed to sync Google Calendar",
        variant: "destructive",
      });
      
      // If authentication failed, show setup mode
      if (error.message?.includes('authentication') || error.message?.includes('Authentication')) {
        setIsSetupMode(true);
      }
    },
  });

  // Auto-sync on component mount and periodically (only for dashboard/main instances)
  useEffect(() => {
    // Only auto-sync from the main dashboard component, not from settings
    const isMainInstance = window.location.pathname === '/';
    
    if (status?.configured && !isSetupMode && !syncMutation.isPending && isMainInstance) {
      // Check if we recently synced (within last 5 minutes)
      const lastSync = localStorage.getItem('lastCalendarSync');
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      if (!lastSync || parseInt(lastSync) < fiveMinutesAgo) {
        // Auto-sync on startup
        syncMutation.mutate();
        localStorage.setItem('lastCalendarSync', now.toString());
      }
      
      // Set up periodic sync every 30 minutes
      const interval = setInterval(() => {
        if (!syncMutation.isPending) {
          syncMutation.mutate();
          localStorage.setItem('lastCalendarSync', Date.now().toString());
        }
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [status?.configured, isSetupMode, syncMutation.isPending]);

  const handleSync = () => {
    if (!status?.configured) {
      setIsSetupMode(true);
      return;
    }
    syncMutation.mutate();
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span>Checking Google Calendar status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Gmail calendar to sync events with Brainbow
          {status?.configured && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              • Auto-syncs every 30 minutes • Syncs on app startup
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            {status?.configured ? (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </div>

        {isSetupMode ? (
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  Google Calendar Authorization
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Complete the OAuth flow to connect your Google Calendar.
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-blue-200 dark:border-blue-800 space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Authorization Steps:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                  <li>Click "Get Authorization URL" to open Google authorization</li>
                  <li>Click "Advanced" → "Go to Brainbow (unsafe)" if you see the unverified app warning</li>
                  <li>Sign in to your Google account and grant calendar access</li>
                  <li>Copy the authorization code shown on the final page</li>
                  <li>Paste the code below and click "Authorize"</li>
                </ol>
              </div>
              
              {authUrl && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      <strong>Manual Authorization URL:</strong>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={authUrl.authUrl}
                        readOnly
                        className="flex-1 px-2 py-1 text-xs border border-amber-300 dark:border-amber-600 rounded bg-white dark:bg-gray-800"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(authUrl.authUrl);
                          toast({ title: "URL copied to clipboard!" });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      Copy this URL, paste it in a new browser tab, and complete the authorization.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Authorization Code:
                    </label>
                    <input
                      type="text"
                      placeholder="Paste authorization code here..."
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm"
                      onChange={(e) => setAuthCode(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={!authCode || authMutation.isPending}
                      onClick={() => authMutation.mutate()}
                    >
                      {authMutation.isPending ? "Authorizing..." : "Authorize Calendar"}
                    </Button>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsSetupMode(false)}
                className="w-full"
              >
                Back to Sync
              </Button>
            </div>
          </div>
        ) : !status?.configured ? (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">Setup Required</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>To sync your Gmail calendar, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Google Calendar API</li>
                <li>Create OAuth 2.0 credentials (Desktop application)</li>
                <li>Download the credentials.json file</li>
                <li>Upload the file to your project root</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Google Console
                </a>
              </Button>
              {isSetupMode && (
                <Button variant="ghost" size="sm" onClick={() => setIsSetupMode(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Google Calendar credentials are configured. Add yourself as a test user to enable sync.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleSync} 
                disabled={syncMutation.isPending}
                className="flex-1"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Calendar
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="default"
                onClick={() => setIsSetupMode(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Setup
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}