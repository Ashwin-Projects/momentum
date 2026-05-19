const prisma = require('../utils/prisma');

const getStartOfDay = (dateInput) => {
  const dayStart = new Date(dateInput);
  dayStart.setHours(0, 0, 0, 0);
  return dayStart;
};

const getEndOfDay = (dateInput) => {
  const dayEnd = new Date(dateInput);
  dayEnd.setHours(23, 59, 59, 999);
  return dayEnd;
};

const syncDailyTargetActuals = async (userId, dateInput) => {
  const dayStart = getStartOfDay(dateInput);
  const dayEnd = getEndOfDay(dateInput);

  const [studySummary, workoutsCompleted, nutritionSummary] = await Promise.all([
    prisma.studySession.aggregate({
      where: {
        userId,
        startedAt: { gte: dayStart, lte: dayEnd }
      },
      _sum: { durationMinutes: true }
    }),
    prisma.workoutLog.count({
      where: {
        userId,
        completedAt: { gte: dayStart, lte: dayEnd }
      }
    }),
    prisma.nutritionLog.aggregate({
      where: {
        userId,
        loggedAt: { gte: dayStart, lte: dayEnd }
      },
      _sum: { calories: true }
    })
  ]);

  const studyMinutesActual = studySummary._sum.durationMinutes || 0;
  const caloriesActual = nutritionSummary._sum.calories || 0;

  await prisma.dailyTarget.upsert({
    where: {
      userId_date: {
        userId,
        date: dayStart
      }
    },
    update: {
      studyMinutesActual,
      workoutsCompleted,
      caloriesActual
    },
    create: {
      userId,
      date: dayStart,
      studyMinutesActual,
      workoutsCompleted,
      caloriesActual
    }
  });
};

module.exports = {
  getStartOfDay,
  getEndOfDay,
  syncDailyTargetActuals
};
