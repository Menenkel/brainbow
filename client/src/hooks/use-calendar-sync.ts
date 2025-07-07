import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalendarSyncOptions {
  enableAutoSync?: boolean;
  syncInterval?: number; // in minutes
  showToasts?: boolean;
}

export function useCalendarSync(options: CalendarSyncOptions = {}) {
  const {
    enableAutoSync = true,
    syncInterval = 30, // 30 minutes
    showToasts = true
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check Google Calendar status
  const { data: calendarStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/google-calendar/status'],
  });

  // Calendar sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/google-calendar/sync', {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Update the last sync time
      localStorage.setItem('lastCalendarSync', Date.now().toString());
      
      // Invalidate calendar queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      
      // Show success toast if events were synced and toasts are enabled
      if (data.synced > 0 && showToasts) {
        toast({
          title: "Calendar Synced",
          description: `Synced ${data.synced} events from Google Calendar`,
        });
      }
    },
    onError: (error) => {
      console.log('Calendar sync failed:', error);
      // Only show error toast if authentication is required and toasts are enabled
      if (showToasts && (error.message?.includes('authentication') || error.message?.includes('Authentication'))) {
        toast({
          title: "Calendar Setup Required",
          description: "Visit Settings to configure Google Calendar sync",
          variant: "destructive",
        });
      }
    }
  });

  // Check if sync is needed
  const shouldSync = () => {
    if (!calendarStatus?.configured || syncMutation.isPending) {
      return false;
    }

    const lastSync = localStorage.getItem('lastCalendarSync');
    if (!lastSync) {
      return true;
    }

    const now = Date.now();
    const syncThreshold = now - (5 * 60 * 1000); // 5 minutes ago
    return parseInt(lastSync) < syncThreshold;
  };

  // Manual sync function
  const syncNow = () => {
    if (shouldSync()) {
      syncMutation.mutate();
    }
  };

  // Auto-sync on mount and periodic sync
  useEffect(() => {
    if (!enableAutoSync) return;

    // Initial sync on mount
    if (shouldSync()) {
      console.log('Auto-syncing Google Calendar...');
      syncMutation.mutate();
    }

    // Set up periodic sync
    if (syncInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (shouldSync()) {
          console.log('Periodic calendar sync...');
          syncMutation.mutate();
        }
      }, syncInterval * 60 * 1000);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [calendarStatus?.configured, enableAutoSync, syncInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    syncNow,
    isSync: syncMutation.isPending,
    isConfigured: calendarStatus?.configured || false,
    lastSyncTime: localStorage.getItem('lastCalendarSync') 
      ? new Date(parseInt(localStorage.getItem('lastCalendarSync')!))
      : null
  };
} 