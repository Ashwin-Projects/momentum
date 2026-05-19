import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkoutLogs, createWorkoutLog, deleteWorkoutLog } from "../api/workout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dumbbell, Plus, Trash2, Clock, Flame, Activity } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatTime, getToday } from "../lib/utils";

const workoutTypes = [
  "strength",
  "cardio",
  "yoga",
  "hiit",
  "swimming",
  "cycling",
  "running",
  "boxing",
  "pilates",
  "other",
];

export default function Workout() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "strength",
    durationMinutes: 45,
    caloriesBurned: "",
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["workout", today],
    queryFn: () => getWorkoutLogs(today),
  });

  const createMutation = useMutation({
    mutationFn: createWorkoutLog,
    onSuccess: () => {
      queryClient.invalidateQueries(["workout"]);
      queryClient.invalidateQueries(["targets"]);
      setIsOpen(false);
      setFormData({ type: "strength", durationMinutes: 45, caloriesBurned: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkoutLog,
    onSuccess: () => {
      queryClient.invalidateQueries(["workout"]);
      queryClient.invalidateQueries(["targets"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      caloriesBurned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : null,
      completedAt: new Date().toISOString(),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const workouts = data?.data || [];
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout Tracking</h1>
          <p className="mt-1 text-zinc-400">Log your workouts</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Workout</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Workout Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories Burned (optional)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.caloriesBurned}
                  onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
                  placeholder="Estimated"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Exercises, reps, how you felt..."
                />
              </div>
              <Button type="submit" className="w-full">Log Workout</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{workouts.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{formatTime(totalMinutes)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Calories Burned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalCalories.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {workouts.length === 0 ? (
        <Card className="border-2 border-dashed border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Dumbbell className="mb-4 h-8 w-8 text-zinc-500" />
            <p className="mb-2 text-lg text-zinc-300">No workouts logged today</p>
            <p className="mb-6 text-sm text-zinc-400">Start tracking your fitness progress</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
              <Dumbbell className="h-4 w-4 text-zinc-400" />
              Today's Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#161616] p-4 transition-colors hover:bg-[#1b1b1b]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{workout.type}</p>
                    <p className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {workout.durationMinutes} min
                      {workout.caloriesBurned && (
                        <>
                           <span className="text-zinc-600">•</span>
                          <span className="flex items-center gap-1">
                             <Flame className="h-3 w-3 text-zinc-500" />
                            {workout.caloriesBurned} cal
                          </span>
                        </>
                      )}
                      {workout.notes && (
                        <>
                           <span className="text-zinc-600">•</span>
                          <span className="truncate">{workout.notes}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 shrink-0 hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(workout.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
