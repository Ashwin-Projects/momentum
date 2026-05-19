import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getToday } from "../lib/utils";
import api from "../api/axios";

export default function AIPlanner() {
  const today = getToday();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch user context on load
  const { data: contextData, isLoading: contextLoading } = useQuery({
    queryKey: ["aiContext", today],
    queryFn: async () => {
      const res = await api.get(`/ai/context?date=${today}`);
      return res.data?.data || null;
    },
  });

  // Load initial data and set up greeting
  useEffect(() => {
    if (contextData && !contextLoading) {
      setContext(contextData);
      // Add initial greeting from AI
      const greeting = generateGreeting(contextData);
      setMessages([
        {
          id: 1,
          text: greeting,
          sender: "ai",
          timestamp: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    }
  }, [contextData, contextLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !context) return;

    const userMessage = input;
    setInput("");

    // Add user message to chat
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();

    setIsLoading(true);
    try {
      // Send message to AI backend
      const res = await api.post("/ai/chat", {
        message: userMessage,
        context: context,
        date: today,
      });

      const aiResponse = res.data?.data?.response || "I'm here to help!";
      const planSections = res.data?.data?.planSections || {};

      // Add AI response to chat
      const aiMsg = {
        id: Date.now() + 1,
        text: aiResponse,
        planSections,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI chat error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again.",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Generate initial greeting based on context
  const generateGreeting = (ctx) => {
    const { todayProgress } = ctx;
    const studyDone = todayProgress.studyMinutes > 0;
    const workoutDone = todayProgress.workoutsCompleted > 0;
    const sleepGoalMet =
      todayProgress.sleepHoursActual >= todayProgress.sleepHoursGoal &&
      todayProgress.sleepHoursGoal > 0;

    let greeting = "Hey there! I'm your Momentum AI assistant. ";
    greeting += "I can see your progress for today: ";

    const progressItems = [];
    if (todayProgress.studyGoal > 0) {
      progressItems.push(
        `${todayProgress.studyMinutes}/${todayProgress.studyGoal}min study`
      );
    }
    if (todayProgress.workoutGoal > 0) {
      progressItems.push(
        `${todayProgress.workoutsCompleted}/${todayProgress.workoutGoal} workouts`
      );
    }
    if (todayProgress.calorieGoal > 0) {
      progressItems.push(
        `${todayProgress.caloriesConsumed}/${todayProgress.calorieGoal} calories`
      );
    }
    if (todayProgress.sleepHoursGoal > 0) {
      progressItems.push(
        `${todayProgress.sleepHoursActual?.toFixed(1) || 0}/${todayProgress.sleepHoursGoal}h sleep`
      );
    }

    greeting += progressItems.join(", ") + ". ";
    greeting +=
      "How can I help you optimize your day? You can ask about study plans, workouts, nutrition, or just say hello!";

    return greeting;
  };

  if (contextLoading || !context) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-amber-500/20 text-amber-100"
                    : "bg-[#1a1a1a] border border-white/[0.06] text-zinc-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-xs text-zinc-500 block mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="text-xs text-zinc-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-[#0a0a0a] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              placeholder="Ask me about your day, studies, workouts, or anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-[60px]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
