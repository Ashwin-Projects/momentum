import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTargets, createTarget, updateTarget, deleteTarget } from "../api/targets";
import { getStudySessions } from "../api/study";
import { getWorkoutLogs } from "../api/workout";
import { getMealLogs } from "../api/nutrition";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { BookOpen, Dumbbell, UtensilsCrossed, Moon, Plus, Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getToday } from "../lib/utils";

const TargetCard = ({ title, icon: Icon, goal, actual, unit }) => {
  const progress = goal > 0 ? Math.min((actual / goal) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
          <Icon className="h-3.5 w-3.5 text-zinc-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold text-zinc-100">{actual}</span>
            <span className="text-sm text-zinc-400">/ {goal} {unit}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{progress.toFixed(0)}% complete</span>
            <span>Goal: {goal} {unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Targets() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    studyMinutesGoal: 120,
    workoutGoal: 1,
    caloriesGoal: 2000,
    sleepHoursGoal: 8,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["targets", today],
    queryFn: () => getTargets(today),
  });

  const { data: studyData, isLoading: studyLoading } = useQuery({
    queryKey: ["study", today],
    queryFn: () => getStudySessions(today),
  });

  const { data: workoutData, isLoading: workoutLoading } = useQuery({
    queryKey: ["workout", today],
    queryFn: () => getWorkoutLogs(today),
  });

  const { data: nutritionData, isLoading: nutritionLoading } = useQuery({
    queryKey: ["nutrition", today],
    queryFn: () => getMealLogs(today),
  });

  const createMutation = useMutation({
    mutationFn: createTarget,
    onSuccess: () => {
      queryClient.invalidateQueries(["targets"]);
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateTarget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["targets"]);
      setIsEditOpen(false);
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTarget,
    onSuccess: () => queryClient.invalidateQueries(["targets"]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, date: today });
  };

  const handleEdit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editTarget.id, updates: formData });
  };

  const openEdit = (target) => {
    setEditTarget(target);
    setFormData({
      studyMinutesGoal: target.studyMinutesGoal || 0,
      workoutGoal: target.workoutGoal || 0,
      caloriesGoal: target.caloriesGoal || 0,
      sleepHoursGoal: target.sleepHoursGoal || 0,
    });
    setIsEditOpen(true);
  };

  if (isLoading || studyLoading || workoutLoading || nutritionLoading) return <LoadingSpinner />;

  const target = data?.data?.[0];
  const hasTarget = !!target;
  const studySessions = studyData?.data || [];
  const workouts = workoutData?.data || [];
  const meals = nutritionData?.data || [];

  const studyMinutesFromLogs = studySessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const workoutsFromLogs = workouts.length;
  const caloriesFromLogs = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

  const studyMinutesActual = studyMinutesFromLogs || target?.studyMinutesActual || 0;
  const workoutsCompleted = workoutsFromLogs || target?.workoutsCompleted || 0;
  const caloriesActual = caloriesFromLogs || target?.caloriesActual || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily Targets</h1>
          <p className="mt-1 text-zinc-400">Set and track your daily goals</p>
        </div>
        {!hasTarget && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Set Targets
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Set Daily Targets</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="study">Study Minutes Goal</Label>
                  <Input
                    id="study"
                    type="number"
                    value={formData.studyMinutesGoal}
                    onChange={(e) => setFormData({ ...formData, studyMinutesGoal: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workout">Workouts Goal</Label>
                  <Input
                    id="workout"
                    type="number"
                    value={formData.workoutGoal}
                    onChange={(e) => setFormData({ ...formData, workoutGoal: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories Goal</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={formData.caloriesGoal}
                    onChange={(e) => setFormData({ ...formData, caloriesGoal: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep">Sleep Hours Goal</Label>
                  <Input
                    id="sleep"
                    type="number"
                    step="0.5"
                    value={formData.sleepHoursGoal}
                    onChange={(e) => setFormData({ ...formData, sleepHoursGoal: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="24"
                  />
                </div>
                <Button type="submit" className="w-full">Save Targets</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!hasTarget ? (
        <Card className="border-2 border-dashed border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Plus className="mb-4 h-8 w-8 text-zinc-500" />
            <p className="mb-2 text-lg text-zinc-300">No targets set for today</p>
            <p className="mb-6 text-sm text-zinc-400">Set goals to start tracking your progress</p>
            <Button variant="outline" onClick={() => setIsOpen(true)}>
              Set Your First Target
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TargetCard
            title="Study"
            icon={BookOpen}
            goal={target.studyMinutesGoal || 0}
            actual={studyMinutesActual}
            unit="min"
          />
          <TargetCard
            title="Workout"
            icon={Dumbbell}
            goal={target.workoutGoal || 0}
            actual={workoutsCompleted}
            unit="sessions"
          />
          <TargetCard
            title="Calories"
            icon={UtensilsCrossed}
            goal={target.caloriesGoal || 0}
            actual={caloriesActual}
            unit="kcal"
          />
          <TargetCard
            title="Sleep"
            icon={Moon}
            goal={target.sleepHoursGoal || 0}
            actual={target.sleepHoursActual?.toFixed(1) || 0}
            unit="hours"
          />
        </div>
      )}

      {hasTarget && (
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(target)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Targets
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(target.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Daily Targets</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-study">Study Minutes Goal</Label>
              <Input
                id="edit-study"
                type="number"
                value={formData.studyMinutesGoal}
                onChange={(e) => setFormData({ ...formData, studyMinutesGoal: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-workout">Workouts Goal</Label>
              <Input
                id="edit-workout"
                type="number"
                value={formData.workoutGoal}
                onChange={(e) => setFormData({ ...formData, workoutGoal: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-calories">Calories Goal</Label>
              <Input
                id="edit-calories"
                type="number"
                value={formData.caloriesGoal}
                onChange={(e) => setFormData({ ...formData, caloriesGoal: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sleep">Sleep Hours Goal</Label>
              <Input
                id="edit-sleep"
                type="number"
                step="0.5"
                value={formData.sleepHoursGoal}
                onChange={(e) => setFormData({ ...formData, sleepHoursGoal: parseFloat(e.target.value) || 0 })}
                min="0"
                max="24"
              />
            </div>
            <Button type="submit" className="w-full">Update Targets</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
