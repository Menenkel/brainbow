import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export function TaskPrioritization() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string; priority: string }) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTaskTitle("");
      toast({
        title: "Task added",
        description: "Your task has been added to the list.",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: number } & Partial<Task>) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been removed from your list.",
      });
    },
  });

  const handleCompleteTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      completed: !task.completed,
    });

    if (!task.completed) {
      toast({
        title: "Task completed!",
        description: `Great job completing "${task.title}".`,
      });
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      // Simple AI-based priority suggestion based on keywords
      let priority = "medium";
      const title = newTaskTitle.toLowerCase();
      
      if (title.includes("urgent") || title.includes("asap") || title.includes("critical") || title.includes("presentation")) {
        priority = "high";
      } else if (title.includes("later") || title.includes("when possible") || title.includes("someday")) {
        priority = "low";
      }

      addTaskMutation.mutate({
        title: newTaskTitle.trim(),
        priority,
      });
    }
  };

  const getPriorityColor = (priority: string, completed: boolean) => {
    if (completed) return "border-green-200 bg-green-50";
    
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-amber-200 bg-amber-50";
      case "low":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-neutral-200 bg-neutral-50";
    }
  };

  const getPriorityTextColor = (priority: string, completed: boolean) => {
    if (completed) return "text-green-700";
    
    switch (priority) {
      case "high":
        return "text-red-700";
      case "medium":
        return "text-amber-700";
      case "low":
        return "text-blue-700";
      default:
        return "text-neutral-700";
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return "No due date";
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays > 1) return `Due in ${diffDays} days`;
    if (diffDays === -1) return "Due yesterday";
    return `${Math.abs(diffDays)} days overdue`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-neutral-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-200">Priority Tasks</h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-primary hover:text-primary/80"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p className="text-sm">No tasks yet. Add one below!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center space-x-3 p-3 border rounded-xl transition-all ${getPriorityColor(task.priority, task.completed)}`}
            >
              <button
                onClick={() => handleCompleteTask(task)}
                disabled={updateTaskMutation.isPending}
                className={`w-5 h-5 border-2 rounded-full hover:scale-110 transition-all flex items-center justify-center ${
                  task.completed
                    ? "border-green-400 bg-green-400"
                    : task.priority === "high"
                    ? "border-red-400 hover:bg-red-400"
                    : task.priority === "medium"
                    ? "border-amber-400 hover:bg-amber-400"
                    : "border-blue-400 hover:bg-blue-400"
                }`}
              >
                {task.completed && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="flex-1">
                <h4 className={`font-medium text-neutral-800 text-sm ${task.completed ? "line-through" : ""}`}>
                  {task.title}
                </h4>
                <p className="text-xs text-neutral-500">
                  {task.completed 
                    ? `Completed at ${new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : formatDueDate(task.dueDate)
                  }
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                task.completed 
                  ? "bg-green-100 text-green-700"
                  : task.priority === "high"
                  ? "bg-red-100 text-red-700"
                  : task.priority === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {task.completed ? "Done" : task.priority === "high" ? "High" : task.priority === "medium" ? "Med" : "Low"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Add Task Input */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
            disabled={addTaskMutation.isPending}
            className="flex-1 bg-neutral-50 border-neutral-200 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || addTaskMutation.isPending}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {addTaskMutation.isPending ? "Adding..." : "Add"}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          AI will automatically suggest priority based on your task description.
        </p>
      </div>
    </div>
  );
}
