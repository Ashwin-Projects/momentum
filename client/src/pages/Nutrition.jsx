import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMealLogs, createMealLog, deleteMealLog } from "../api/nutrition";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UtensilsCrossed, Plus, Trash2, Flame, Beef, Wheat, Droplets } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getToday } from "../lib/utils";

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

export default function Nutrition() {
  const queryClient = useQueryClient();
  const today = getToday();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    mealType: "lunch",
    foodName: "",
    calories: "",
    proteinGrams: "",
    carbsGrams: "",
    fatGrams: "",
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["nutrition", today],
    queryFn: () => getMealLogs(today),
  });

  const createMutation = useMutation({
    mutationFn: createMealLog,
    onSuccess: () => {
      queryClient.invalidateQueries(["nutrition"]);
      queryClient.invalidateQueries(["targets"]);
      setIsOpen(false);
      setFormData({ mealType: "lunch", foodName: "", calories: "", proteinGrams: "", carbsGrams: "", fatGrams: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMealLog,
    onSuccess: () => {
      queryClient.invalidateQueries(["nutrition"]);
      queryClient.invalidateQueries(["targets"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      calories: parseInt(formData.calories) || 0,
      proteinGrams: formData.proteinGrams ? parseInt(formData.proteinGrams) : null,
      carbsGrams: formData.carbsGrams ? parseInt(formData.carbsGrams) : null,
      fatGrams: formData.fatGrams ? parseInt(formData.fatGrams) : null,
      loggedAt: new Date().toISOString(),
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const meals = data?.data || [];
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.proteinGrams || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbsGrams || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fatGrams || 0), 0);

  const mealsByType = meals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) acc[meal.mealType] = [];
    acc[meal.mealType].push(meal);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nutrition Tracking</h1>
          <p className="mt-1 text-zinc-400">Log your meals</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Meal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Select
                  value={formData.mealType}
                  onValueChange={(v) => setFormData({ ...formData, mealType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodName">Food Name</Label>
                <Input
                  id="foodName"
                  value={formData.foodName}
                  onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                  placeholder="e.g. Grilled chicken salad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="kcal"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={formData.proteinGrams}
                    onChange={(e) => setFormData({ ...formData, proteinGrams: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={formData.carbsGrams}
                    onChange={(e) => setFormData({ ...formData, carbsGrams: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={formData.fatGrams}
                    onChange={(e) => setFormData({ ...formData, fatGrams: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Log Meal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalCalories.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Beef className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalProtein}g</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalCarbs}g</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500">Fat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-zinc-400" />
              <span className="text-3xl font-semibold text-zinc-100">{totalFat}g</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {meals.length === 0 ? (
        <Card className="border-2 border-dashed border-white/[0.08]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UtensilsCrossed className="mb-4 h-8 w-8 text-zinc-500" />
            <p className="mb-2 text-lg text-zinc-300">No meals logged today</p>
            <p className="mb-6 text-sm text-zinc-400">Start tracking your nutrition</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Your First Meal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mealTypes.map((type) => {
              const typeMeals = mealsByType[type] || [];
              if (typeMeals.length === 0) return null;
              return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                    <UtensilsCrossed className="h-4 w-4 text-zinc-400" />
                    {type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#161616] p-3 transition-colors hover:bg-[#1b1b1b]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{meal.foodName}</p>
                          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-zinc-500" />
                              {meal.calories} cal
                            </span>
                            {meal.proteinGrams && (
                              <span className="text-zinc-600">•</span>
                            )}
                            {meal.proteinGrams && (
                              <span className="text-zinc-400">P: {meal.proteinGrams}g</span>
                            )}
                            {meal.carbsGrams && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-400">C: {meal.carbsGrams}g</span>
                              </>
                            )}
                            {meal.fatGrams && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-400">F: {meal.fatGrams}g</span>
                              </>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 shrink-0 hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(meal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
