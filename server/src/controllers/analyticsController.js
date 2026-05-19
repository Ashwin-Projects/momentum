const analyticsService = require('../services/analyticsService');

const getDateRangeFromQuery = (query) => ({
  startDate: query.startDate,
  endDate: query.endDate
});

const getDateRangeFromDays = (daysValue) => {
  const allowedDays = [7, 14, 30];
  const parsedDays = Number.parseInt(daysValue, 10);
  const days = allowedDays.includes(parsedDays) ? parsedDays : 7;

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate, days };
};

const getAnalyticsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = getDateRangeFromQuery(req.query);

    const [
      weeklyStudySummary,
      workoutFrequency,
      sleepAnalysis,
      nutritionSummary,
      focusAnalysis,
      moodTrends,
      screenTimeBreakdown
    ] = await Promise.all([
      analyticsService.getWeeklyStudySummary(userId, dateRange),
      analyticsService.getWorkoutFrequency(userId, dateRange),
      analyticsService.getSleepAnalysis(userId, dateRange),
      analyticsService.getNutritionSummary(userId, dateRange),
      analyticsService.getFocusAnalysis(userId, dateRange),
      analyticsService.getMoodTrends(userId, dateRange),
      analyticsService.getScreenTimeBreakdown(userId, dateRange)
    ]);

    return res.json({
      success: true,
      data: {
        weeklyStudySummary,
        workoutFrequency,
        sleepAnalysis,
        nutritionSummary,
        focusAnalysis,
        moodTrends,
        screenTimeBreakdown
      },
      message: 'Analytics summary retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const getAnalyticsTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = getDateRangeFromQuery(req.query);
    const trends = await analyticsService.getAnalyticsTrends(userId, dateRange);

    return res.json({
      success: true,
      data: trends,
      message: 'Analytics trends retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const getMoodTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, days } = getDateRangeFromDays(req.query.days);
    const trends = await analyticsService.getMoodTrendsByPeriod(userId, { startDate, endDate });

    return res.json({
      success: true,
      data: {
        ...trends,
        days
      },
      message: 'Mood trends retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const getFocusTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, days } = getDateRangeFromDays(req.query.days);
    const trends = await analyticsService.getFocusTrendsByPeriod(userId, { startDate, endDate });

    return res.json({
      success: true,
      data: {
        ...trends,
        days
      },
      message: 'Focus trends retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const getScreenTimeBreakdown = async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = getDateRangeFromQuery(req.query);
    const breakdown = await analyticsService.getScreenTimeCategoryBreakdown(userId, dateRange);

    return res.json({
      success: true,
      data: breakdown,
      message: 'Screen time breakdown retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

const getProductivityScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const hasDaysQuery = req.query.days !== undefined;
    const dateRange = hasDaysQuery
      ? getDateRangeFromDays(req.query.days)
      : getDateRangeFromQuery(req.query);
    const scoreData = await analyticsService.getProductivityScoreByDay(userId, dateRange);

    return res.json({
      success: true,
      data: scoreData,
      message: 'Productivity score retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: 500
    });
  }
};

module.exports = {
  getAnalyticsSummary,
  getAnalyticsTrends,
  getMoodTrends,
  getFocusTrends,
  getScreenTimeBreakdown,
  getProductivityScore
};
