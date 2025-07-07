import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  timestamp: Date;
}

export function AIChat() {
  const [inputMessage, setInputMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/history"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
      setPendingMessage(null);
      scrollToBottom();
    },
    onError: () => {
      setPendingMessage(null);
    },
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, pendingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !chatMutation.isPending) {
      const message = inputMessage.trim();
      setPendingMessage(message);
      setInputMessage("");
      chatMutation.mutate(message);
      scrollToBottom();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-gray-700 h-96 flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <Bot className="text-white h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-gray-200">AI Planning Assistant</h3>
            <p className="text-xs text-secondary">Online • Ready to help</p>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white h-3 w-3" />
              </div>
              <div className="bg-neutral-100 dark:bg-gray-700 rounded-2xl rounded-tl-md p-3 w-4/5">
                <p className="text-sm text-neutral-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  Hi! I'm here to help you plan your day and manage stress. What would you like to focus on today?
                </p>
              </div>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat.id} className="space-y-3">
                {/* User Message */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-primary rounded-2xl rounded-tr-md p-3 w-4/5">
                    <p className="text-sm text-white whitespace-pre-wrap break-words">{chat.message}</p>
                    <span className="text-xs text-primary-200 mt-1 block">
                      {formatTime(chat.timestamp)}
                    </span>
                  </div>
                  <div className="w-6 h-6 bg-gradient-to-r from-accent to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white h-3 w-3" />
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-white h-3 w-3" />
                  </div>
                  <div className="bg-neutral-100 dark:bg-gray-700 rounded-2xl rounded-tl-md p-3 w-4/5">
                    <p className="text-sm text-neutral-700 dark:text-gray-300 whitespace-pre-wrap break-words">{chat.response}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Show pending message immediately */}
          {pendingMessage && (
            <div className="flex items-start space-x-3 justify-end">
              <div className="bg-primary rounded-2xl rounded-tr-md p-3 w-4/5">
                <p className="text-sm text-white whitespace-pre-wrap break-words">{pendingMessage}</p>
                <span className="text-xs text-primary-200 mt-1 block">
                  {formatTime(new Date())}
                </span>
              </div>
              <div className="w-6 h-6 bg-gradient-to-r from-accent to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-white h-3 w-3" />
              </div>
            </div>
          )}
          
          {/* Loading indicator for pending message */}
          {chatMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="text-white h-3 w-3" />
              </div>
              <div className="bg-neutral-100 dark:bg-gray-700 rounded-2xl rounded-tl-md p-3 w-auto">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-neutral-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-neutral-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Ask about your day, schedule, or how you're feeling..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={chatMutation.isPending}
              className="pr-12 bg-neutral-50 dark:bg-gray-700 border-neutral-200 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
