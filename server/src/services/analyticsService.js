const prisma = require('../utils/prisma');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateRange = (dateRange) => {
  const startDate = toDate(dateRange && dateRange.startDate);
  const endDate = toDate(dateRange && dateRange.endDate);

  if (startDate && endDate && startDate <= endDate) {
    return { startDate, endDate };
  }

  return { startDate: null, endDate: null };
};

const defaultLast7DaysRange = () => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

const withDateRange = (field, dateRange, fallbackLast7Days = false) => {
  const normalized = normalizeDateRange(dateRange);
  const range =
    normalized.startDate && normalized.endDate
      ? normalized
      : fallbackLast7Days
        ? defaultLast7DaysRange()
        : null;

  if (!range) {
    return {};
  }

  return {
    [field]: {
      gte: range.startDate,
      lte: range.endDate
    }
  };
};

const getRangeDayCount = (dateRange, fallback = 7) => {
  const normalized = normalizeDateRange(dateRange);

  if (!normalized.startDate || !normalized.endDate) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor((normalized.endDate.getTime() - normalized.startDate.getTime()) / MS_PER_DAY) + 1
  );
};

const dateKey = (value) => new Date(value).toISOString().split('T')[0];

const mean = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const round2 = (value) => Math.round(value * 100) / 100;

const moodScore = (mood) => {
  const mapping = {
    great: 5,
    good: 4,
    neutral: 3,
    low: 2,
    bad: 1
  };
  return mapping[String(mood || '').toLowerCase()] || 0;
};

const getWeeklyStudySummary = async (userId, dateRange) => {
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      ...withDateRange('startedAt', dateRange)
    },
    select: {
      subject: true,
      durationMinutes: true
    }
  });

  const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const dayCount = getRangeDayCount(dateRange, 7);
  const bySubject = {};

  sessions.forEach((session) => {
    bySubject[session.subject] = (bySubject[session.subject] || 0) + session.durationMinutes;
  });

  const mostStudiedSubject =
    Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    totalMinutes,
    averagePerDay: round2(totalMinutes / dayCount),
    mostStudiedSubject: mostStudiedSubject
      ? { subject: mostStudiedSubject[0], minutes: mostStudiedSubject[1] }
      : null
  };
};

const getWorkoutFrequency = async (userId, dateRange) => {
  const workouts = await prisma.workoutLog.findMany({
    where: {
      userId,
      ...withDateRange('completedAt', dateRange)
    },
    select: {
      type: true,
      caloriesBurned: true
    }
  });

  const totalWorkouts = workouts.length;
  const totalCaloriesBurned = workouts.reduce(
    (sum, workout) => sum + (workout.caloriesBurned || 0),
    0
  );

  const typeCount = {};
  workouts.forEach((workout) => {
    typeCount[workout.type] = (typeCount[workout.type] || 0) + 1;
  });

  const mostCommonWorkoutType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    totalWorkouts,
    totalCaloriesBurned,
    mostCommonWorkoutType: mostCommonWorkoutType
      ? { type: mostCommonWorkoutType[0], count: mostCommonWorkoutType[1] }
      : null
  };
};

const getSleepAnalysis = async (userId, dateRange) => {
  const logs = await prisma.dailyTarget.findMany({
    where: {
      userId,
      ...withDateRange('date', dateRange)
    },
    select: {
      sleepHoursActual: true,
      sleepHoursGoal: true
    }
  });

  const durations = logs.map((log) => log.sleepHoursActual || 0);
  const averageDuration = round2(mean(durations));

  const qualityValues = logs
    .filter((log) => (log.sleepHoursGoal || 0) > 0)
    .map((log) => Math.min(10, ((log.sleepHoursActual || 0) / log.sleepHoursGoal) * 10));
  const averageQuality = qualityValues.length ? round2(mean(qualityValues)) : 0;

  const durationMean = mean(durations);
  const variance = durations.length
    ? durations.reduce((sum, duration) => sum + (duration - durationMean) ** 2, 0) / durations.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = round2(Math.max(0, 100 - (stdDev / 4) * 100));

  return {
    averageDuration,
    averageQuality,
    consistencyScore
  };
};

const getNutritionSummary = async (userId, dateRange) => {
  const logs = await prisma.nutritionLog.findMany({
    where: {
      userId,
      ...withDateRange('loggedAt', dateRange)
    },
    select: {
      loggedAt: true,
      calories: true,
      proteinGrams: true,
      carbsGrams: true,
      fatGrams: true
    }
  });

  const byDay = {};
  logs.forEach((log) => {
    const key = dateKey(log.loggedAt);
    byDay[key] = byDay[key] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    byDay[key].calories += log.calories || 0;
    byDay[key].protein += log.proteinGrams || 0;
    byDay[key].carbs += log.carbsGrams || 0;
    byDay[key].fat += log.fatGrams || 0;
  });

  const daily = Object.values(byDay);

  return {
    averageDailyCalories: round2(mean(daily.map((d) => d.calories))),
    averageProtein: round2(mean(daily.map((d) => d.protein))),
    averageCarbs: round2(mean(daily.map((d) => d.carbs))),
    averageFat: round2(mean(daily.map((d) => d.fat)))
  };
};

const getFocusAnalysis = async (userId, dateRange) => {
  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      ...withDateRange('startedAt', dateRange)
    },
    select: {
      focusScore: true,
      distractionsCount: true,
      durationMinutes: true
    }
  });

  const totalDeepWorkMinutes = sessions
    .filter((session) => session.focusScore >= 8)
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  return {
    averageFocusScore: round2(mean(sessions.map((session) => session.focusScore || 0))),
    averageDistractions: round2(mean(sessions.map((session) => session.distractionsCount || 0))),
    totalDeepWorkMinutes
  };
};

const getMoodTrends = async (userId, dateRange) => {
  const logs = await prisma.moodLog.findMany({
    where: {
      userId,
      ...withDateRange('loggedAt', dateRange, true)
    },
    select: {
      mood: true,
      energyLevel: true,
      stressLevel: true
    }
  });

  return {
    averageMood: round2(mean(logs.map((log) => moodScore(log.mood)))),
    averageEnergy: round2(mean(logs.map((log) => log.energyLevel || 0))),
    averageStress: round2(mean(logs.map((log) => log.stressLevel || 0)))
  };
};

const getScreenTimeBreakdown = async (userId, dateRange) => {
  const logs = await prisma.screenTimeLog.findMany({
    where: {
      userId,
      ...withDateRange('loggedAt', dateRange)
    },
    select: {
      category: true,
      durationMinutes: true
    }
  });

  const totals = {
    productive: 0,
    distracting: 0,
    neutral: 0
  };

  logs.forEach((log) => {
    const category = String(log.category || '').toLowerCase();
    if (totals[category] !== undefined) {
      totals[category] += log.durationMinutes || 0;
    }
  });

  return {
    ...totals,
    totalMinutes: totals.productive + totals.distracting + totals.neutral
  };
};

const getAnalyticsTrends = async (userId, dateRange) => {
  const [study, workouts, sleep, nutrition, focus, mood, screenTime] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, ...withDateRange('startedAt', dateRange, true) },
      select: { startedAt: true, durationMinutes: true }
    }),
    prisma.workoutLog.findMany({
      where: { userId, ...withDateRange('completedAt', dateRange, true) },
      select: { completedAt: true, caloriesBurned: true }
    }),
    prisma.dailyTarget.findMany({
      where: { userId, ...withDateRange('date', dateRange, true) },
      select: { date: true, sleepHoursActual: true, sleepHoursGoal: true }
    }),
    prisma.nutritionLog.findMany({
      where: { userId, ...withDateRange('loggedAt', dateRange, true) },
      select: { loggedAt: true, calories: true }
    }),
    prisma.focusSession.findMany({
      where: { userId, ...withDateRange('startedAt', dateRange, true) },
      select: { startedAt: true, focusScore: true, distractionsCount: true, durationMinutes: true }
    }),
    prisma.moodLog.findMany({
      where: { userId, ...withDateRange('loggedAt', dateRange, true) },
      select: { loggedAt: true, mood: true, energyLevel: true, stressLevel: true }
    }),
    prisma.screenTimeLog.findMany({
      where: { userId, ...withDateRange('loggedAt', dateRange, true) },
      select: { loggedAt: true, category: true, durationMinutes: true }
    })
  ]);

  const studyByDay = {};
  study.forEach((item) => {
    const key = dateKey(item.startedAt);
    studyByDay[key] = (studyByDay[key] || 0) + item.durationMinutes;
  });

  const workoutsByDay = {};
  workouts.forEach((item) => {
    const key = dateKey(item.completedAt);
    workoutsByDay[key] = workoutsByDay[key] || { count: 0, caloriesBurned: 0 };
    workoutsByDay[key].count += 1;
    workoutsByDay[key].caloriesBurned += item.caloriesBurned || 0;
  });

  const sleepByDay = {};
  sleep.forEach((item) => {
    const key = dateKey(item.date);
    sleepByDay[key] = {
      duration: item.sleepHoursActual || 0,
      goal: item.sleepHoursGoal || 0
    };
  });

  const nutritionByDay = {};
  nutrition.forEach((item) => {
    const key = dateKey(item.loggedAt);
    nutritionByDay[key] = (nutritionByDay[key] || 0) + (item.calories || 0);
  });

  const focusByDay = {};
  focus.forEach((item) => {
    const key = dateKey(item.startedAt);
    focusByDay[key] = focusByDay[key] || {
      focusScoreTotal: 0,
      distractionsTotal: 0,
      sessions: 0,
      deepWorkMinutes: 0
    };
    focusByDay[key].focusScoreTotal += item.focusScore || 0;
    focusByDay[key].distractionsTotal += item.distractionsCount || 0;
    focusByDay[key].sessions += 1;
    if (item.focusScore >= 8) {
      focusByDay[key].deepWorkMinutes += item.durationMinutes || 0;
    }
  });

  const moodByDay = {};
  mood.forEach((item) => {
    const key = dateKey(item.loggedAt);
    moodByDay[key] = moodByDay[key] || { moodTotal: 0, energyTotal: 0, stressTotal: 0, count: 0 };
    moodByDay[key].moodTotal += moodScore(item.mood);
    moodByDay[key].energyTotal += item.energyLevel || 0;
    moodByDay[key].stressTotal += item.stressLevel || 0;
    moodByDay[key].count += 1;
  });

  const screenTimeByDay = {};
  screenTime.forEach((item) => {
    const key = dateKey(item.loggedAt);
    screenTimeByDay[key] = screenTimeByDay[key] || {
      productive: 0,
      distracting: 0,
      neutral: 0
    };
    const category = String(item.category || '').toLowerCase();
    if (screenTimeByDay[key][category] !== undefined) {
      screenTimeByDay[key][category] += item.durationMinutes || 0;
    }
  });

  return {
    studyMinutesByDay: Object.entries(studyByDay).map(([date, minutes]) => ({ date, minutes })),
    workoutsByDay: Object.entries(workoutsByDay).map(([date, values]) => ({ date, ...values })),
    sleepByDay: Object.entries(sleepByDay).map(([date, values]) => ({ date, ...values })),
    nutritionCaloriesByDay: Object.entries(nutritionByDay).map(([date, calories]) => ({ date, calories })),
    focusByDay: Object.entries(focusByDay).map(([date, values]) => ({
      date,
      averageFocusScore: values.sessions ? round2(values.focusScoreTotal / values.sessions) : 0,
      averageDistractions: values.sessions ? round2(values.distractionsTotal / values.sessions) : 0,
      deepWorkMinutes: values.deepWorkMinutes
    })),
    moodByDay: Object.entries(moodByDay).map(([date, values]) => ({
      date,
      averageMood: values.count ? round2(values.moodTotal / values.count) : 0,
      averageEnergy: values.count ? round2(values.energyTotal / values.count) : 0,
      averageStress: values.count ? round2(values.stressTotal / values.count) : 0
    })),
    screenTimeByDay: Object.entries(screenTimeByDay).map(([date, values]) => ({
      date,
      ...values,
      total: values.productive + values.distracting + values.neutral
    }))
  };
};

const getMoodTrendsByPeriod = async (userId, dateRange) => {
  const logs = await prisma.moodLog.findMany({
    where: {
      userId,
      ...withDateRange('loggedAt', dateRange, true)
    },
    select: {
      loggedAt: true,
      mood: true,
      energyLevel: true,
      stressLevel: true
    }
  });

  const byDay = {};
  logs.forEach((log) => {
    const key = dateKey(log.loggedAt);
    byDay[key] = byDay[key] || { moodTotal: 0, energyTotal: 0, stressTotal: 0, count: 0 };
    byDay[key].moodTotal += moodScore(log.mood);
    byDay[key].energyTotal += log.energyLevel || 0;
    byDay[key].stressTotal += log.stressLevel || 0;
    byDay[key].count += 1;
  });

  return {
    averageMood: round2(mean(logs.map((log) => moodScore(log.mood)))),
    averageEnergy: round2(mean(logs.map((log) => log.energyLevel || 0))),
    averageStress: round2(mean(logs.map((log) => log.stressLevel || 0))),
    entriesCount: logs.length,
    moodByDay: Object.entries(byDay).map(([date, values]) => ({
      date,
      averageMood: values.count ? round2(values.moodTotal / values.count) : 0,
      averageEnergy: values.count ? round2(values.energyTotal / values.count) : 0,
      averageStress: values.count ? round2(values.stressTotal / values.count) : 0
    }))
  };
};

const getFocusTrendsByPeriod = async (userId, dateRange) => {
  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      ...withDateRange('startedAt', dateRange, true)
    },
    select: {
      startedAt: true,
      focusScore: true,
      distractionsCount: true,
      durationMinutes: true
    }
  });

  const byDay = {};
  sessions.forEach((session) => {
    const key = dateKey(session.startedAt);
    byDay[key] = byDay[key] || {
      focusScoreTotal: 0,
      distractionsTotal: 0,
      sessions: 0,
      deepWorkMinutes: 0
    };
    byDay[key].focusScoreTotal += session.focusScore || 0;
    byDay[key].distractionsTotal += session.distractionsCount || 0;
    byDay[key].sessions += 1;
    if ((session.focusScore || 0) >= 8) {
      byDay[key].deepWorkMinutes += session.durationMinutes || 0;
    }
  });

  const totalDeepWorkMinutes = sessions
    .filter((session) => (session.focusScore || 0) >= 8)
    .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

  return {
    averageFocusScore: round2(mean(sessions.map((session) => session.focusScore || 0))),
    averageDistractions: round2(mean(sessions.map((session) => session.distractionsCount || 0))),
    totalDeepWorkMinutes,
    focusByDay: Object.entries(byDay).map(([date, values]) => ({
      date,
      averageFocusScore: values.sessions ? round2(values.focusScoreTotal / values.sessions) : 0,
      averageDistractions: values.sessions ? round2(values.distractionsTotal / values.sessions) : 0,
      deepWorkMinutes: values.deepWorkMinutes
    }))
  };
};

const getScreenTimeCategoryBreakdown = async (userId, dateRange) => {
  const logs = await prisma.screenTimeLog.findMany({
    where: {
      userId,
      ...withDateRange('loggedAt', dateRange, true)
    },
    select: {
      category: true,
      durationMinutes: true
    }
  });

  const totals = {
    productive: 0,
    distracting: 0,
    neutral: 0
  };

  logs.forEach((log) => {
    const category = String(log.category || '').toLowerCase();
    if (totals[category] !== undefined) {
      totals[category] += log.durationMinutes || 0;
    }
  });

  const totalMinutes = totals.productive + totals.distracting + totals.neutral;

  return {
    ...totals,
    totalMinutes,
    percentages: {
      productive: totalMinutes ? round2((totals.productive / totalMinutes) * 100) : 0,
      distracting: totalMinutes ? round2((totals.distracting / totalMinutes) * 100) : 0,
      neutral: totalMinutes ? round2((totals.neutral / totalMinutes) * 100) : 0
    }
  };
};

const getProductivityScoreByDay = async (userId, dateRange) => {
  const [study, workouts, sleep, focus] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, ...withDateRange('startedAt', dateRange, true) },
      select: { startedAt: true, durationMinutes: true }
    }),
    prisma.workoutLog.findMany({
      where: { userId, ...withDateRange('completedAt', dateRange, true) },
      select: { completedAt: true, durationMinutes: true }
    }),
    prisma.dailyTarget.findMany({
      where: { userId, ...withDateRange('date', dateRange, true) },
      select: { date: true, sleepHoursActual: true, sleepHoursGoal: true }
    }),
    prisma.focusSession.findMany({
      where: { userId, ...withDateRange('startedAt', dateRange, true) },
      select: { startedAt: true, focusScore: true }
    })
  ]);

  const dayMap = {};
  const ensureDay = (key) => {
    dayMap[key] = dayMap[key] || {
      studyMinutes: 0,
      workoutMinutes: 0,
      sleepHoursActual: 0,
      sleepHoursGoal: 8,
      focusScoreTotal: 0,
      focusSessions: 0
    };
  };

  study.forEach((entry) => {
    const key = dateKey(entry.startedAt);
    ensureDay(key);
    dayMap[key].studyMinutes += entry.durationMinutes || 0;
  });

  workouts.forEach((entry) => {
    const key = dateKey(entry.completedAt);
    ensureDay(key);
    dayMap[key].workoutMinutes += entry.durationMinutes || 0;
  });

  sleep.forEach((entry) => {
    const key = dateKey(entry.date);
    ensureDay(key);
    dayMap[key].sleepHoursActual = entry.sleepHoursActual || 0;
    dayMap[key].sleepHoursGoal = entry.sleepHoursGoal || 8;
  });

  focus.forEach((entry) => {
    const key = dateKey(entry.startedAt);
    ensureDay(key);
    dayMap[key].focusScoreTotal += entry.focusScore || 0;
    dayMap[key].focusSessions += 1;
  });

  const dailyScores = Object.entries(dayMap)
    .map(([date, values]) => {
      const studyScore = Math.min(100, ((values.studyMinutes || 0) / 120) * 100);
      const workoutScore = Math.min(100, ((values.workoutMinutes || 0) / 45) * 100);
      const sleepGoal = values.sleepHoursGoal > 0 ? values.sleepHoursGoal : 8;
      const sleepScore = Math.min(100, ((values.sleepHoursActual || 0) / sleepGoal) * 100);
      const averageFocusScore = values.focusSessions
        ? values.focusScoreTotal / values.focusSessions
        : 0;
      const focusScore = Math.min(100, averageFocusScore * 10);

      const productivityScore = round2(
        studyScore * 0.35 + workoutScore * 0.2 + sleepScore * 0.2 + focusScore * 0.25
      );

      return {
        date,
        studyScore: round2(studyScore),
        workoutScore: round2(workoutScore),
        sleepScore: round2(sleepScore),
        focusScore: round2(focusScore),
        productivityScore
      };
    })
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    averageProductivityScore: round2(mean(dailyScores.map((entry) => entry.productivityScore))),
    daysTracked: dailyScores.length,
    dailyScores
  };
};

module.exports = {
  getWeeklyStudySummary,
  getWorkoutFrequency,
  getSleepAnalysis,
  getNutritionSummary,
  getFocusAnalysis,
  getMoodTrends,
  getScreenTimeBreakdown,
  getAnalyticsTrends,
  getMoodTrendsByPeriod,
  getFocusTrendsByPeriod,
  getScreenTimeCategoryBreakdown,
  getProductivityScoreByDay
};
