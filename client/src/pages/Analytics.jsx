import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSummary, getTrends } from "../api/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BookOpen, Dumbbell, UtensilsCrossed, Moon, Activity } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageWrapper from "../components/common/PageWrapper";
import ScrollReveal from "../components/common/ScrollReveal";

const getDateRange = (days) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2 shadow-xl">
        <p className="mb-1 text-xs text-zinc-500 font-medium">
          {new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
        <p className="text-sm font-semibold text-zinc-200">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const sortByDate = (entries) =>
  [...entries].sort((left, right) => new Date(left.date) - new Date(right.date));

const ChartEmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] bg-[#0a0a0a]/50 px-6 text-center">
    <Icon className="mb-3 h-7 w-7 text-zinc-600" />
    <p className="text-sm font-medium text-zinc-400">{title}</p>
    <p className="mt-1 max-w-xs text-xs text-zinc-500">{description}</p>
  </div>
);

export default function Analytics() {
  const [range, setRange] = useState("7");
  const days = parseInt(range, 10);
  const { startDate, endDate } = getDateRange(days);

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics-summary", startDate, endDate],
    queryFn: () => getSummary(startDate, endDate),
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["analytics-trends", startDate, endDate],
    queryFn: () => getTrends(startDate, endDate),
  });

  if (summaryLoading || trendsLoading) return <LoadingSpinner />;

  const summary = summaryData?.data || {};
  const trends = trendsData?.data || {};

  const studySummary = summary.weeklyStudySummary || {};
  const workoutSummary = summary.workoutFrequency || {};
  const nutritionSummary = summary.nutritionSummary || {};
  const sleepSummary = summary.sleepAnalysis || {};

  const studyByDay = sortByDate(trends.studyMinutesByDay || []);
  const workoutByDay = sortByDate(trends.workoutsByDay || []);
  const caloriesByDay = sortByDate(trends.nutritionCaloriesByDay || []);
  const sleepByDay = sortByDate(trends.sleepByDay || []).map((entry) => ({
    ...entry,
    hours: entry.duration,
  }));

  const totalCalories = caloriesByDay.reduce((sum, entry) => sum + (entry.calories || 0), 0);
  const avgWorkoutsPerDay = days > 0 ? (workoutSummary.totalWorkouts || 0) / days : 0;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">View your performance trends</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40 bg-[#141414] border-white/[0.04] text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-white/[0.04]">
              <SelectItem value="7" className="text-zinc-300">Last 7 days</SelectItem>
              <SelectItem value="14" className="text-zinc-300">Last 14 days</SelectItem>
              <SelectItem value="30" className="text-zinc-300">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollReveal>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/[0.04] bg-[#141414]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Study Time</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-600" />
              <span className="text-3xl font-semibold text-zinc-100">
                {Math.floor((studySummary.totalMinutes || 0) / 60)}h {(studySummary.totalMinutes || 0) % 60}m
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {studySummary.averagePerDay || 0} min/day avg
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-zinc-600" />
              <span className="text-3xl font-semibold text-zinc-100">{workoutSummary.totalWorkouts || 0}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {avgWorkoutsPerDay.toFixed(1)} workouts/day avg
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-zinc-600" />
              <span className="text-3xl font-semibold text-zinc-100">{totalCalories.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {nutritionSummary.averageDailyCalories || 0} cal/day avg
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Sleep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-zinc-600" />
              <span className="text-3xl font-semibold text-zinc-100">{sleepSummary.averageDuration?.toFixed(1) || 0}h</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {sleepSummary.averageQuality?.toFixed(1) || 0}/10 goal score avg
            </p>
          </CardContent>
        </Card>
        </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="border-white/[0.04] bg-[#141414]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <BookOpen className="h-4 w-4 text-zinc-600" />
                Study Minutes by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studyByDay.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studyByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" verticalLines={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        stroke="#52525b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46", strokeWidth: 1 }} />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={{ fill: "#d97706", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: "#d97706" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState
                  icon={BookOpen}
                  title="No study data yet"
                  description="Log study sessions to see your daily minutes trend."
                />
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/[0.04] bg-[#141414]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <Activity className="h-4 w-4 text-zinc-600" />
                Workouts by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workoutByDay.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" verticalLines={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="count" fill="#71717a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmptyState icon={Activity} title="No workout data yet" description="Log workouts to see how often you train each day." />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/[0.04] bg-[#141414]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <UtensilsCrossed className="h-4 w-4 text-zinc-600" />
                Calories by Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caloriesByDay.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={caloriesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" verticalLines={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      stroke="#52525b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="calories" fill="#71717a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmptyState icon={UtensilsCrossed} title="No nutrition data yet" description="Log meals to track calories over time." />
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
          <Card className="border-white/[0.04] bg-[#141414]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <Moon className="h-4 w-4 text-zinc-600" />
                Sleep Hours by Day
              </CardTitle>
            </CardHeader>
          <CardContent>
            {sleepByDay.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" verticalLines={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    stroke="#52525b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 12]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#71717a"
                    strokeWidth={2}
                    dot={{ fill: "#71717a", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#71717a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <ChartEmptyState icon={Moon} title="No sleep data yet" description="Log sleep on the Sleep page to see your nightly trend." />
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

    </div>
    </PageWrapper>
  );
}
