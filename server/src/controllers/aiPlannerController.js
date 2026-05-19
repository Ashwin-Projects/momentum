const prisma = require('../utils/prisma');
const { getStartOfDay, getEndOfDay } = require('../services/dailyTargetSyncService');
const { generatePlan } = require('../services/aiPlannerService');

const createFallbackSection = (title, summary, recommendations = []) => ({
  title,
  summary,
  recommendations,
});

const buildFallbackPlan = (userContext) => {
  const progress = userContext?.todayProgress || {};

  return {
    response:
      "Here's a practical plan based on your latest Momentum data.",
    planSections: {
      study: createFallbackSection(
        'Study',
        `Current progress: ${progress.studyMinutes || 0}/${progress.studyGoal || 0} minutes.`,
        ['Do one focused study block for 45-60 minutes.', 'Review your weakest topic before ending the day.']
      ),
      workout: createFallbackSection(
        'Workout',
        `Current progress: ${progress.workoutsCompleted || 0}/${progress.workoutGoal || 0} workouts.`,
        ['Complete one planned workout session today.', 'Keep intensity moderate if study load is high.']
      ),
      nutrition: createFallbackSection(
        'Nutrition',
        `Current progress: ${progress.caloriesConsumed || 0}/${progress.calorieGoal || 0} kcal.`,
        ['Keep your next meal balanced with protein, carbs, and healthy fats.', 'Avoid late-night overeating.']
      ),
      sleep: createFallbackSection(
        'Sleep',
        `Current progress: ${progress.sleepHoursActual || 0}/${progress.sleepHoursGoal || 0} hours.`,
        ['Set a fixed bedtime tonight.', 'Aim for screen-off at least 30 minutes before sleep.']
      ),
    },
  };
};

const buildUserContext = async (userId, dateInput = new Date()) => {
  const startOfToday = getStartOfDay(dateInput);
  const endOfToday = getEndOfDay(dateInput);

  const weekStart = new Date(startOfToday);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    todaysTargets,
    recentTargets,
    recentStudySessions,
    recentWorkouts,
    recentNutrition,
    recentSleep,
  ] = await Promise.all([
    prisma.dailyTarget.findMany({
      where: {
        userId,
        date: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.dailyTarget.findMany({
      where: {
        userId,
        date: { gte: weekStart, lte: endOfToday },
      },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: startOfToday, lte: endOfToday } },
      orderBy: { startedAt: 'desc' },
      take: 10,
    }),
    prisma.workoutLog.findMany({
      where: { userId, completedAt: { gte: startOfToday, lte: endOfToday } },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.nutritionLog.findMany({
      where: { userId, loggedAt: { gte: startOfToday, lte: endOfToday } },
      orderBy: { loggedAt: 'desc' },
      take: 10,
    }),
    prisma.dailyTarget.findMany({
      where: {
        userId,
        OR: [{ sleepHoursGoal: { gt: 0 } }, { sleepHoursActual: { gt: 0 } }],
      },
      select: {
        date: true,
        sleepHoursGoal: true,
        sleepHoursActual: true,
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
  ]);

  const today = todaysTargets[0];

  return {
    todayProgress: {
      studyMinutes: today?.studyMinutesActual || 0,
      studyGoal: today?.studyMinutesGoal || 0,
      workoutsCompleted: today?.workoutsCompleted || 0,
      workoutGoal: today?.workoutGoal || 0,
      caloriesConsumed: today?.caloriesActual || 0,
      calorieGoal: today?.caloriesGoal || 0,
      sleepHoursActual: today?.sleepHoursActual || 0,
      sleepHoursGoal: today?.sleepHoursGoal || 0,
    },
    targets: recentTargets.map((t) => ({
      date: t.date,
      studyMinutesGoal: t.studyMinutesGoal,
      studyMinutesActual: t.studyMinutesActual,
      workoutGoal: t.workoutGoal,
      workoutsCompleted: t.workoutsCompleted,
      caloriesGoal: t.caloriesGoal,
      caloriesActual: t.caloriesActual,
      sleepHoursGoal: t.sleepHoursGoal,
      sleepHoursActual: t.sleepHoursActual,
    })),
    recentSessions: recentStudySessions.map((s) => ({
      subject: s.subject,
      duration: s.durationMinutes,
      startedAt: s.startedAt?.toISOString(),
    })),
    recentWorkouts: recentWorkouts.map((w) => ({
      type: w.type,
      duration: w.durationMinutes,
      caloriesBurned: w.caloriesBurned,
    })),
    mealsToday: recentNutrition.map((m) => ({
      type: m.mealType,
      food: m.foodName,
      calories: m.calories,
    })),
    recentSleep: recentSleep.map((s) => ({
      date: s.date,
      goal: s.sleepHoursGoal,
      actual: s.sleepHoursActual,
    })),
  };
};

const getAIContext = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const context = await buildUserContext(req.user.id, date);

    res.json({
      success: true,
      data: context,
      message: 'AI planner context retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const chatWithAI = async (req, res) => {
  try {
    const { message, conversationHistory, date } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const contextDate = date ? new Date(date) : new Date();
    const userContext = await buildUserContext(req.user.id, contextDate);
    const aiResult = await generatePlan(
      userContext,
      String(message).trim(),
      Array.isArray(conversationHistory) ? conversationHistory : []
    );

    res.json({
      success: true,
      data: {
        response: aiResult.message,
        planSections: aiResult.planSections,
      },
      message: 'AI response generated successfully',
    });
  } catch (error) {
    console.error('AI Chat Error:', error.message,error.stack);
    const contextDate = req.body?.date ? new Date(req.body.date) : new Date();
    const userContext = await buildUserContext(req.user.id, contextDate);
    const fallback = buildFallbackPlan(userContext);

    res.json({
      success: true,
      data: {
        response: fallback.response,
        planSections: fallback.planSections,
        fallback: true,
      },
      message: `Fallback response generated: ${error.message || 'Unknown error'}`,
    });
  }
};

module.exports = { getAIContext, chatWithAI, buildUserContext };
