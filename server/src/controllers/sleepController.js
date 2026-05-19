const prisma = require('../utils/prisma');

// GET - Get sleep data for user (from DailyTarget)
const getSleepLogs = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const logs = await prisma.dailyTarget.findMany({
      where,
      select: {
        id: true,
        date: true,
        sleepHoursGoal: true,
        sleepHoursActual: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      data: logs,
      message: 'Sleep logs retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Log sleep (create or update DailyTarget with sleep data)
const logSleep = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, sleepHoursGoal, sleepHoursActual } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if target exists
    let target = await prisma.dailyTarget.findFirst({
      where: { userId, date: targetDate }
    });

    if (target) {
      // Update existing
      target = await prisma.dailyTarget.update({
        where: { id: target.id },
        data: {
          ...(sleepHoursGoal !== undefined && { sleepHoursGoal }),
          ...(sleepHoursActual !== undefined && { sleepHoursActual })
        }
      });
    } else {
      // Create new
      target = await prisma.dailyTarget.create({
        data: {
          userId,
          date: targetDate,
          sleepHoursGoal: sleepHoursGoal || 0,
          sleepHoursActual: sleepHoursActual || 0
        }
      });
    }

    res.status(201).json({
      success: true,
      data: target,
      message: 'Sleep logged successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update sleep data
const updateSleepLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.dailyTarget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Sleep log not found' });
    }

    const { sleepHoursGoal, sleepHoursActual } = req.body;

    const target = await prisma.dailyTarget.update({
      where: { id },
      data: {
        ...(sleepHoursGoal !== undefined && { sleepHoursGoal }),
        ...(sleepHoursActual !== undefined && { sleepHoursActual })
      }
    });

    res.json({
      success: true,
      data: target,
      message: 'Sleep log updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete sleep data (reset to defaults)
const deleteSleepLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.dailyTarget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Sleep log not found' });
    }

    await prisma.dailyTarget.update({
      where: { id },
      data: {
        sleepHoursGoal: 0,
        sleepHoursActual: 0
      }
    });

    res.json({
      success: true,
      message: 'Sleep log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getSleepLogs, logSleep, updateSleepLog, deleteSleepLog };