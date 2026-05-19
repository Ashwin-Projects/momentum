const prisma = require('../utils/prisma');

// GET - Get all screen time logs for user
const getScreenTimeLogs = async (req, res) => {
  try {
    const { date, startDate, endDate, category } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.loggedAt = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.loggedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (category) {
      where.category = category;
    }

    const logs = await prisma.screenTimeLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' }
    });

    res.json({
      success: true,
      data: logs,
      message: 'Screen time logs retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new screen time log
const createScreenTimeLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appName, durationMinutes, category, loggedAt, dailyTargetId } = req.body;

    if (!appName || !durationMinutes || !category || !loggedAt) {
      return res.status(400).json({
        success: false,
        error: 'appName, durationMinutes, category, and loggedAt are required'
      });
    }

    const log = await prisma.screenTimeLog.create({
      data: {
        userId,
        appName,
        durationMinutes,
        category,
        loggedAt: new Date(loggedAt),
        dailyTargetId: dailyTargetId || null
      }
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Screen time log created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a screen time log
const updateScreenTimeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.screenTimeLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Screen time log not found' });
    }

    const { appName, durationMinutes, category, loggedAt } = req.body;

    const log = await prisma.screenTimeLog.update({
      where: { id },
      data: {
        ...(appName !== undefined && { appName }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(category !== undefined && { category }),
        ...(loggedAt !== undefined && { loggedAt: new Date(loggedAt) })
      }
    });

    res.json({
      success: true,
      data: log,
      message: 'Screen time log updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a screen time log
const deleteScreenTimeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.screenTimeLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Screen time log not found' });
    }

    await prisma.screenTimeLog.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Screen time log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getScreenTimeLogs,
  createScreenTimeLog,
  updateScreenTimeLog,
  deleteScreenTimeLog
};