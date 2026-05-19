const prisma = require('../utils/prisma');

const toCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized =
    value instanceof Date ? value.toISOString() : String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
};

const toCsv = (rows, headers) => {
  const headerRow = headers.join(',');
  const dataRows = rows.map((row) =>
    headers.map((header) => toCsvValue(row[header])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

const sendCsv = (res, filename, rows, headers) => {
  const csvContent = toCsv(rows, headers);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvContent);
};

const getAllExportData = async (userId) => {
  const [studySessions, workoutLogs, nutritionLogs, sleepLogs] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' }
    }),
    prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    }),
    prisma.nutritionLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' }
    }),
    prisma.dailyTarget.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        date: true,
        sleepHoursGoal: true,
        sleepHoursActual: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { date: 'desc' }
    })
  ]);

  return {
    studySessions,
    workoutLogs,
    nutritionLogs,
    sleepLogs
  };
};

const exportStudyCsv = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' }
    });
    const headers = [
      'id',
      'userId',
      'subject',
      'durationMinutes',
      'notes',
      'startedAt',
      'dailyTargetId',
      'createdAt',
      'updatedAt'
    ];

    return sendCsv(res, 'study-sessions.csv', rows, headers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const exportWorkoutCsv = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    });
    const headers = [
      'id',
      'userId',
      'type',
      'durationMinutes',
      'caloriesBurned',
      'notes',
      'completedAt',
      'dailyTargetId',
      'createdAt',
      'updatedAt'
    ];

    return sendCsv(res, 'workout-logs.csv', rows, headers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const exportNutritionCsv = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.nutritionLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' }
    });
    const headers = [
      'id',
      'userId',
      'mealType',
      'foodName',
      'calories',
      'proteinGrams',
      'carbsGrams',
      'fatGrams',
      'loggedAt',
      'dailyTargetId',
      'createdAt',
      'updatedAt'
    ];

    return sendCsv(res, 'nutrition-logs.csv', rows, headers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const exportSleepCsv = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.dailyTarget.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        date: true,
        sleepHoursGoal: true,
        sleepHoursActual: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { date: 'desc' }
    });
    const headers = [
      'id',
      'userId',
      'date',
      'sleepHoursGoal',
      'sleepHoursActual',
      'createdAt',
      'updatedAt'
    ];

    return sendCsv(res, 'sleep-logs.csv', rows, headers);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const exportAllJson = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getAllExportData(userId);

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      data
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="momentum-export.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

module.exports = {
  exportStudyCsv,
  exportWorkoutCsv,
  exportNutritionCsv,
  exportSleepCsv,
  exportAllJson
};
