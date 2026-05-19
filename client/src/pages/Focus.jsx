import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Clock3, Pause, Play, Trash2, X } from "lucide-react";
import { createFocusSession, deleteFocusSession, getFocusSessions } from "../api/focus";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatTime, getToday } from "../lib/utils";

const PRESET_DURATIONS = [15, 25, 45, 60];
const POMODORO_WORK_MINUTES = 25;
const POMODORO_BREAK_MINUTES = 5;

const toClock = (secondsLeft) => {
  const total = Math.max(0, secondsLeft);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function Focus() {
  const queryClient = useQueryClient();
  const today = getToday();

  const [taskName, setTaskName] = useState("");
  const [durationChoice, setDurationChoice] = useState("25");
  const [customMinutes, setCustomMinutes] = useState("30");
  const [pomodoroMode, setPomodoroMode] = useState(false);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPhase, setTimerPhase] = useState("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionDurationForLog, setSessionDurationForLog] = useState(25);

  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionData, setCompletionData] = useState({
    focusScore: 8,
    distractionsCount: 0,
  });

  const selectedMinutes = useMemo(() => {
    if (durationChoice === "custom") {
      const parsed = Number.parseInt(customMinutes, 10);
      return Number.isNaN(parsed) ? 25 : Math.max(1, parsed);
    }
    return Number.parseInt(durationChoice, 10);
  }, [customMinutes, durationChoice]);

  const { data, isLoading } = useQuery({
    queryKey: ["focus", today],
    queryFn: () => getFocusSessions(today),
  });

  const createMutation = useMutation({
    mutationFn: createFocusSession,
    onSuccess: () => {
      queryClient.invalidateQueries(["focus"]);
      queryClient.invalidateQueries(["analytics-summary"]);
      queryClient.invalidateQueries(["analytics-trends"]);
      setCompletionOpen(false);
      setCompletionData({ focusScore: 8, distractionsCount: 0 });
      setTaskName("");
      setSessionStartedAt(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFocusSession,
    onSuccess: () => {
      queryClient.invalidateQueries(["focus"]);
      queryClient.invalidateQueries(["analytics-summary"]);
      queryClient.invalidateQueries(["analytics-trends"]);
    },
  });

  useEffect(() => {
    if (!isSessionActive || !isTimerRunning) {
      return undefined;
    }

    if (remainingSeconds <= 0) {
      if (pomodoroMode && timerPhase === "focus") {
        setTimerPhase("break");
        setRemainingSeconds(POMODORO_BREAK_MINUTES * 60);
        return undefined;
      }

      setIsTimerRunning(false);
      setIsSessionActive(false);
      setCompletionOpen(true);
      return undefined;
    }

    const timeout = setTimeout(() => {
      setRemainingSeconds((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isSessionActive, isTimerRunning, pomodoroMode, remainingSeconds, timerPhase]);

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTimerRunning]);

  useEffect(() => {
    if (!isSessionActive) {
      return undefined;
    }

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isSessionActive]);

  const sessions = data?.data || [];
  const totalMinutes = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const averageFocus = sessions.length
    ? sessions.reduce((sum, session) => sum + (session.focusScore || 0), 0) / sessions.length
    : 0;
  const distractions = sessions.reduce((sum, session) => sum + (session.distractionsCount || 0), 0);

  const startTimer = () => {
    const minutes = pomodoroMode ? POMODORO_WORK_MINUTES : selectedMinutes;
    setSessionDurationForLog(minutes);
    setTimerPhase("focus");
    setRemainingSeconds(minutes * 60);
    setSessionStartedAt(new Date().toISOString());
    setIsSessionActive(true);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setIsSessionActive(false);
    setTimerPhase("focus");
    setRemainingSeconds((pomodoroMode ? POMODORO_WORK_MINUTES : selectedMinutes) * 60);
    setSessionStartedAt(null);
  };

  const submitCompletion = (event) => {
    event.preventDefault();

    createMutation.mutate({
      taskName: taskName.trim() || "Focus Session",
      durationMinutes: sessionDurationForLog,
      focusScore: completionData.focusScore,
      distractionsCount: completionData.distractionsCount,
      startedAt: sessionStartedAt || new Date().toISOString(),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Focus Timer</h1>
          <p className="mt-1 text-zinc-400">Deep-work sessions with automatic completion logging</p>
        </div>

        <Card className="border border-white/[0.08] bg-[#101010]">
          <CardHeader>
            <CardTitle className="text-zinc-100">Session setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="focus-task">Task name</Label>
              <Input
                id="focus-task"
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="What are you working on?"
                className="bg-[#0f0f0f]"
              />
            </div>

            <div className="space-y-3">
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_DURATIONS.map((minutes) => (
                  <Button
                    key={minutes}
                    type="button"
                    variant={durationChoice === String(minutes) ? "default" : "outline"}
                    className={durationChoice === String(minutes) ? "bg-[#d97706] text-black hover:bg-[#c56b06]" : ""}
                    onClick={() => setDurationChoice(String(minutes))}
                  >
                    {minutes} min
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={durationChoice === "custom" ? "default" : "outline"}
                  className={durationChoice === "custom" ? "bg-[#d97706] text-black hover:bg-[#c56b06]" : ""}
                  onClick={() => setDurationChoice("custom")}
                >
                  Custom
                </Button>
              </div>
              {durationChoice === "custom" && (
                <Input
                  type="number"
                  min="1"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  className="max-w-[180px] bg-[#0f0f0f]"
                  placeholder="Custom minutes"
                />
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-200">Pomodoro mode</p>
                <p className="text-xs text-zinc-500">25 min focus + 5 min break</p>
              </div>
              <Button
                type="button"
                variant={pomodoroMode ? "default" : "outline"}
                className={pomodoroMode ? "bg-[#d97706] text-black hover:bg-[#c56b06]" : ""}
                onClick={() => setPomodoroMode((value) => !value)}
              >
                {pomodoroMode ? "On" : "Off"}
              </Button>
            </div>

            <Button
              type="button"
              onClick={startTimer}
              className="w-full bg-[#d97706] text-black hover:bg-[#c56b06]"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Focus Session
            </Button>
          </CardContent>
        </Card>

        {!isSessionActive && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border border-white/[0.08] bg-[#101010]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Focused Time</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-zinc-400" />
                  <span className="text-3xl font-semibold text-zinc-100">{formatTime(totalMinutes)}</span>
                </CardContent>
              </Card>
              <Card className="border border-white/[0.08] bg-[#101010]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Average Focus</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zinc-400" />
                  <span className="text-3xl font-semibold text-zinc-100">{averageFocus.toFixed(1)}</span>
                </CardContent>
              </Card>
              <Card className="border border-white/[0.08] bg-[#101010]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Distractions</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-3xl font-semibold text-zinc-100">{distractions}</span>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-white/[0.08] bg-[#101010]">
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Today's Focus Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/[0.08] bg-[#0a0a0a] py-12 text-center text-zinc-400">
                    No focus sessions logged today.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#161616] p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-zinc-100">{session.taskName}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                            <span>{session.durationMinutes} min</span>
                            <span className="text-zinc-600">•</span>
                            <span>Focus {session.focusScore}/10</span>
                            <span className="text-zinc-600">•</span>
                            <span>{session.distractionsCount} distractions</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                          onClick={() => deleteMutation.mutate(session.id)}
                        >
                          <Trash2 className="h-4 w-4 text-zinc-500 hover:text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isSessionActive && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-[#0a0a0a] px-6 py-8 md:px-12">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
            <Input
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              className="h-11 max-w-xl border-[#d97706]/30 bg-[#121212] text-lg text-zinc-100 focus-visible:ring-[#d97706]"
              placeholder="Task name for this session"
            />
            <span className="rounded-full border border-[#d97706]/30 bg-[#d97706]/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#d97706]">
              {pomodoroMode && timerPhase === "break" ? "Break phase" : "Focus phase"}
            </span>
          </div>

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
            <p className="mb-5 text-sm uppercase tracking-[0.28em] text-zinc-500">Stay locked in</p>
            <h2 className="text-[18vw] font-semibold leading-none text-zinc-100 sm:text-[10rem]">{toClock(remainingSeconds)}</h2>
            <div className="mt-8 flex items-center gap-3">
              <Button
                type="button"
                className="bg-[#d97706] text-black hover:bg-[#c56b06]"
                onClick={() => setIsTimerRunning((value) => !value)}
              >
                {isTimerRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isTimerRunning ? "Pause" : "Resume"}
              </Button>
              <Button type="button" variant="outline" onClick={stopTimer}>
                <X className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">Navigation is locked while the timer is active.</p>
          </div>
        </div>
      )}

      <Dialog open={completionOpen} onOpenChange={(open) => open && setCompletionOpen(true)}>
        <DialogContent className="max-w-sm border-[#d97706]/20 bg-[#111111]">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Session complete</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCompletion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focusScore">Focus rating (1-10)</Label>
              <Input
                id="focusScore"
                type="number"
                min="1"
                max="10"
                value={completionData.focusScore}
                onChange={(event) =>
                  setCompletionData((value) => ({
                    ...value,
                    focusScore: Math.min(10, Math.max(1, Number.parseInt(event.target.value, 10) || 1)),
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distractionsCount">Distractions</Label>
              <Input
                id="distractionsCount"
                type="number"
                min="0"
                value={completionData.distractionsCount}
                onChange={(event) =>
                  setCompletionData((value) => ({
                    ...value,
                    distractionsCount: Math.max(0, Number.parseInt(event.target.value, 10) || 0),
                  }))
                }
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#d97706] text-black hover:bg-[#c56b06]">
              Save session
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
