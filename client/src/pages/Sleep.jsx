import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSleepLogs, logSleep, deleteSleepLog } from "../api/sleep";
import { getTargets } from "../api/targets";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Moon, Plus, Trash2, Clock, BedDouble, Target } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getToday } from "../lib/utils";

export default function Sleep() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(7);

  const { data: sleepData, isLoading: sleepLoading } = useQuery({
    queryKey: ["sleep", today],
    queryFn: () => getSleepLogs(today),
  });

  const { data: targetsData } = useQuery({
    queryKey: ["targets", today],
    queryFn: () => getTargets(today),
  });

  const logMutation = useMutation({
    mutationFn: () => logSleep(today, hours),
    onSuccess: () => {
      queryClient.invalidateQueries(["sleep"]);
      queryClient.invalidateQueries(["targets"]);
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSleepLog,
    onSuccess: () => {
      queryClient.invalidateQueries(["sleep"]);
      queryClient.invalidateQueries(["targets"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    logMutation.mutate();
  };

  if (sleepLoading) return <LoadingSpinner />;

  const sleepLogs = sleepData?.data || [];
  const target = targetsData?.data?.[0];
  const totalHours = target?.sleepHoursActual || 0;
  const goalHours = target?.sleepHoursGoal || 8;
  const progress = goalHours > 0 ? Math.min((totalHours / goalHours) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sleep Tracking</h1>
          <p className="mt-1 text-zinc-400">Track your sleep</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Sleep
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[325px]">
            <DialogHeader>
              <DialogTitle>Log Sleep</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Slept</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={logMutation.isPending}>
                Log Sleep
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Total Sleep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalHours.toFixed(1)}h</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Goal: {goalHours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalHours.toFixed(1)}h</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">per night</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{progress.toFixed(0)}%</span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{totalHours.toFixed(1)} / {goalHours}h</p>
          </CardContent>
        </Card>
      </div>

      {target ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <BedDouble className="h-4 w-4 text-zinc-400" />
              Sleep Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#161616] p-4">
                <div>
                  <p className="font-medium">Last Night</p>
                  <p className="flex items-center gap-2 text-sm text-zinc-400">
                    <Moon className="h-3 w-3 text-zinc-500" />
                    {totalHours.toFixed(1)} hours of sleep
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400">Goal: {goalHours}h</p>
                  <p className={`text-sm font-medium ${totalHours >= goalHours ? "text-zinc-200" : "text-zinc-400"}`}>
                    {totalHours >= goalHours ? "Goal met!" : `${(goalHours - totalHours).toFixed(1)}h remaining`}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Progress to goal</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Moon className="mb-4 h-8 w-8 text-zinc-500" />
            <p className="mb-2 text-lg text-zinc-300">No sleep data recorded</p>
            <p className="mb-6 text-sm text-zinc-400">Set a sleep goal in Targets to start tracking</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Your Sleep
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
