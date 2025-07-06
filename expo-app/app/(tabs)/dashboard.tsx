import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// TODO: Replace placeholders with actual ported components
// import TodaySchedule from "../../components/TodaySchedule";
// import SleepCheckIn from "../../components/SleepCheckIn";
// import EmotionalStateUpdate from "../../components/EmotionalStateUpdate";
// import AutoDayPlanner from "../../components/AutoDayPlanner";

export default function DashboardScreen() {
  const queryClient = useQueryClient();

  // Example query (adapt endpoint as needed)
  const { data: calendarStatus } = useQuery({
    queryKey: ['/api/google-calendar/status'],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Replace with your API request logic
      return await fetch('/api/google-calendar/sync', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
    onError: (error: unknown) => {
      console.log('Calendar sync failed:', error);
    }
  });

  useEffect(() => {
    if (calendarStatus?.configured && !syncMutation.isPending) {
      syncMutation.mutate();
    }
  }, [calendarStatus?.configured]);

  return (
    <View style={styles.container}>
      {/* Placeholders for your ported components */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text>SleepCheckIn (placeholder)</Text>
        </View>
        <View style={styles.col}>
          <Text>EmotionalStateUpdate (placeholder)</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.colLarge}>
          <Text>TodaySchedule (placeholder)</Text>
        </View>
        <View style={styles.col}>
          <Text>AutoDayPlanner (placeholder)</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>✨</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f0f4ff" },
  row: { flexDirection: "row", marginBottom: 16 },
  col: { flex: 1, alignItems: "center", justifyContent: "center" },
  colLarge: { flex: 2, alignItems: "center", justifyContent: "center" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 24 },
}); 