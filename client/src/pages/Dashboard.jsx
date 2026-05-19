import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getTargets } from "../api/targets";
import { getStudySessions } from "../api/study";
import { getWorkoutLogs } from "../api/workout";
import { getMealLogs } from "../api/nutrition";
import { getSleepLogs } from "../api/sleep";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  BookOpen,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  TrendingUp,
  Flame,
  Activity,
  Zap,
  ArrowRight,
  Target,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageWrapper from "../components/common/PageWrapper";
import AnimatedCard from "../components/common/AnimatedCard";
import AnimatedNumber from "../components/common/AnimatedNumber";
import { formatTime, getToday, getWeekDates, getDayName } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const StatCard = ({ title, value, progress, icon: Icon, unit, delay = 0, animateValue = false }) => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
  return (
    <AnimatedCard delay={delay}>
      <Card className="border-white/[0.04] bg-[#141414] transition-all duration-150 hover:border-white/[0.08] hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-zinc-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight text-zinc-100">
            {animateValue ? <AnimatedNumber value={numericValue} /> : value}
            {unit && <span className="ml-1 text-sm text-zinc-500">{unit}</span>}
          </div>
          <Progress value={progress} className="mt-3 h-1.5" />
          <p className="mt-2 text-xs text-zinc-500">
            {progress > 0 ? `${progress.toFixed(0)}% complete` : 'No progress yet'}
          </p>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2 shadow-xl">
        <p className="mb-1 text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-zinc-200">{payload[0].value}{payload[0].unit}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const today = getToday();
  const weekDates = getWeekDates();

  const { data: targetsData, isLoading: targetsLoading } = useQuery({
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

  const { data: sleepData } = useQuery({
    queryKey: ["sleep", today],
    queryFn: () => getSleepLogs(today),
  });

  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const { data: weekSleepData } = useQuery({
    queryKey: ["sleep", "week", weekStart, weekEnd],
    queryFn: () => getSleepLogs(weekStart, weekEnd),
  });

  if (targetsLoading || studyLoading || workoutLoading || nutritionLoading) {
    return <LoadingSpinner />;
  }

  const target = targetsData?.data?.[0];
  const studySessions = studyData?.data || [];
  const workouts = workoutData?.data || [];
  const meals = nutritionData?.data || [];
  const sleepLogs = sleepData?.data || [];

  const studyMinutes = studySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const workoutsCompleted = workouts.length;
  const caloriesConsumed = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const caloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const sleepHours = target?.sleepHoursActual || sleepLogs[0]?.duration || 0;

  const studyGoal = target?.studyMinutesGoal || 0;
  const studyProgress = studyGoal > 0 ? Math.min((studyMinutes / studyGoal) * 100, 100) : 0;
  const workoutGoal = target?.workoutGoal || 0;
  const workoutProgress = workoutGoal > 0 ? Math.min((workoutsCompleted / workoutGoal) * 100, 100) : 0;
  const calorieGoal = target?.caloriesGoal || 0;
  const calorieProgress = calorieGoal > 0 ? Math.min((caloriesConsumed / calorieGoal) * 100, 100) : 0;
  const sleepGoal = target?.sleepHoursGoal || 0;
  const sleepProgress = sleepGoal > 0 ? Math.min((sleepHours / sleepGoal) * 100, 100) : 0;

  const productivityScore = Math.round(
    (studyProgress + workoutProgress + calorieProgress + sleepProgress) / 4
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const studyChartData = weekDates.map(date => {
    const sessions = studyData?.data?.filter(s => s.startedAt?.startsWith(date)) || [];
    const minutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return { day: getDayName(date), minutes, fullDate: date };
  });

  const workoutChartData = weekDates.map(date => {
    const dayWorkouts = workoutData?.data?.filter(w => w.completedAt?.startsWith(date)) || [];
    const count = dayWorkouts.length;
    return { day: getDayName(date), count, fullDate: date };
  });

  const sleepChartData = weekDates.map((date) => {
    const log = (weekSleepData?.data || []).find((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      return entryDate === date;
    });
    return {
      day: getDayName(date),
      hours: log?.sleepHoursActual ?? 0,
      fullDate: date,
    };
  });

  const isNewUser =
    !target &&
    studySessions.length === 0 &&
    workouts.length === 0 &&
    meals.length === 0 &&
    sleepHours === 0;

  const onboardingSteps = [
    { to: "/targets", label: "Set daily targets", icon: Target },
    { to: "/study", label: "Log a study session", icon: BookOpen },
    { to: "/workout", label: "Log a workout", icon: Dumbbell },
    { to: "/nutrition", label: "Track a meal", icon: UtensilsCrossed },
    { to: "/sleep", label: "Log your sleep", icon: Moon },
  ];

  return (
    <PageWrapper>
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        >
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-zinc-500">Here's your productivity overview for today</p>
          </div>
          {/* Integrated Productivity Widget */}
          <div className="flex items-stretch gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#141414] px-5 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d97706]/10">
                <Zap className="h-5 w-5 text-[#d97706]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Score</p>
                <p className="text-2xl font-semibold text-zinc-100"><AnimatedNumber value={productivityScore} />%</p>
              </div>
            </div>
            {/* Quick insight */}
            <div className="flex items-center rounded-xl border border-white/[0.04] bg-[#141414] px-4 py-3">
              <div className="max-w-[180px]">
                <p className="text-xs text-zinc-500">
                  {productivityScore >= 75 ? "Excellent progress!" : productivityScore >= 50 ? "Keep pushing forward" : "Let's get things moving"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {isNewUser && (
          <AnimatedCard delay={0.05}>
            <Card className="border-amber-500/20 bg-gradient-to-br from-[#141414] to-[#1a1410]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-200">
                  Welcome to Momentum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Your dashboard will fill in as you log activity. Start with these steps:
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {onboardingSteps.map((step) => (
                    <Link
                      key={step.to}
                      to={step.to}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:border-amber-500/30 hover:bg-[#141414]"
                    >
                      <span className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-amber-500" />
                        {step.label}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Study Time"
            value={formatTime(studyMinutes)}
            progress={studyProgress}
            icon={BookOpen}
            unit={studyGoal > 0 ? `of ${studyGoal}m` : null}
            delay={0.1}
            animateValue
          />
          <StatCard
            title="Workouts"
            value={workoutsCompleted}
            progress={workoutProgress}
            icon={Dumbbell}
            unit={workoutGoal > 0 ? `of ${workoutGoal}` : null}
            delay={0.15}
            animateValue
          />
          <StatCard
            title="Calories"
            value={caloriesConsumed.toLocaleString()}
            progress={calorieProgress}
            icon={UtensilsCrossed}
            unit={calorieGoal > 0 ? `/ ${calorieGoal}` : null}
            delay={0.2}
            animateValue
          />
          <StatCard
            title="Sleep"
            value={sleepHours.toFixed(1)}
            progress={sleepProgress}
            icon={Moon}
            unit={sleepGoal > 0 ? `of ${sleepGoal}h` : null}
            delay={0.25}
            animateValue
          />
        </div>

      {/* Charts Section */}
      <AnimatedCard delay={0.3}>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Study Trend Chart */}
          <Card className="col-span-1 md:col-span-1 border-white/[0.04] bg-[#141414] transition-all duration-150 hover:border-white/[0.08] hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                <BookOpen className="h-4 w-4 text-zinc-600" />
                Study Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studyChartData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      dy={5}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#d97706"
                      strokeWidth={2}
                      fill="url(#studyGradient)"
                    />
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-zinc-600">This week</p>
            </CardContent>
          </Card>

        {/* Workout Consistency Chart */}
        <Card className="col-span-1 md:col-span-1 border-white/[0.04] bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <Flame className="h-4 w-4 text-zinc-600" />
              Workout Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutChartData}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    dy={5}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar
                    dataKey="count"
                    fill="#71717a"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-600">This week</p>
          </CardContent>
        </Card>

        {/* Sleep Trend Chart */}
        <Card className="col-span-1 md:col-span-1 border-white/[0.04] bg-[#141414]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <Moon className="h-4 w-4 text-zinc-600" />
              Sleep Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepChartData}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    dy={5}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#71717a"
                    strokeWidth={2}
                    dot={{ fill: '#71717a', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#71717a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-600">This week</p>
          </CardContent>
        </Card>
        </div>
      </AnimatedCard>

      {/* Activity Section */}
      <AnimatedCard delay={0.4}>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Today's Goals */}
          <Card className="border-white/[0.04] bg-[#141414] transition-all duration-150 hover:border-white/[0.08] hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <TrendingUp className="h-4 w-4 text-zinc-600" />
              Today's Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {target ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Study</span>
                    <span className="font-medium text-zinc-300">{studyMinutes} / {studyGoal}m</span>
                  </div>
                  <Progress value={studyProgress} className="h-1.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Workouts</span>
                    <span className="font-medium text-zinc-300">{workoutsCompleted} / {workoutGoal}</span>
                  </div>
                  <Progress value={workoutProgress} className="h-1.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Calories</span>
                    <span className="font-medium text-zinc-300">{caloriesConsumed} / {calorieGoal}</span>
                  </div>
                  <Progress value={calorieProgress} className="h-1.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Sleep</span>
                    <span className="font-medium text-zinc-300">{sleepHours.toFixed(1)} / {sleepGoal}h</span>
                  </div>
                  <Progress value={sleepProgress} className="h-1.5" />
                </div>
              </div>
            ) : (
              <p className="py-4 text-sm text-zinc-500">No goals set for today</p>
            )}
          </CardContent>
        </Card>

        {/* Study Sessions */}
        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <BookOpen className="h-4 w-4 text-zinc-600" />
              Study Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studySessions.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">No sessions logged today</p>
            ) : (
              <div className="space-y-3">
                {studySessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      <span className="max-w-[140px] truncate text-sm text-zinc-300">{session.subject}</span>
                    </div>
                    <span className="text-sm text-zinc-500">{session.durationMinutes}m</span>
                  </div>
                ))}
                {studySessions.length > 4 && (
                  <p className="pt-2 text-xs text-zinc-500">+{studySessions.length - 4} more sessions</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 font-medium">
              <Activity className="h-4 w-4 text-zinc-600" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <p className="py-4 text-sm text-zinc-500">No workouts logged today</p>
            ) : (
              <div className="space-y-3">
                {workouts.slice(0, 4).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      <span className="text-sm text-zinc-300 capitalize">{workout.type || workout.workoutType}</span>
                    </div>
                    <span className="text-sm text-zinc-500">{workout.durationMinutes}m</span>
                  </div>
                ))}
                {workouts.length > 4 && (
                  <p className="pt-2 text-xs text-zinc-500">+{workouts.length - 4} more workouts</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </AnimatedCard>
    </div>
    </PageWrapper>
  );
}
