const prisma = require('../utils/prisma');

// GET - Get all mood logs for user
const getMoodLogs = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
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

    const logs = await prisma.moodLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' }
    });

    res.json({
      success: true,
      data: logs,
      message: 'Mood logs retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new mood log
const createMoodLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood, energyLevel, stressLevel, notes, loggedAt, dailyTargetId } = req.body;

    if (!mood || !loggedAt) {
      return res.status(400).json({
        success: false,
        error: 'mood and loggedAt are required'
      });
    }

    const log = await prisma.moodLog.create({
      data: {
        userId,
        mood,
        energyLevel: energyLevel || 5,
        stressLevel: stressLevel || 5,
        notes: notes || null,
        loggedAt: new Date(loggedAt),
        dailyTargetId: dailyTargetId || null
      }
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Mood log created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a mood log
const updateMoodLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.moodLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mood log not found' });
    }

    const { mood, energyLevel, stressLevel, notes, loggedAt } = req.body;

    const log = await prisma.moodLog.update({
      where: { id },
      data: {
        ...(mood !== undefined && { mood }),
        ...(energyLevel !== undefined && { energyLevel }),
        ...(stressLevel !== undefined && { stressLevel }),
        ...(notes !== undefined && { notes }),
        ...(loggedAt !== undefined && { loggedAt: new Date(loggedAt) })
      }
    });

    res.json({
      success: true,
      data: log,
      message: 'Mood log updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a mood log
const deleteMoodLog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.moodLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Mood log not found' });
    }

    await prisma.moodLog.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Mood log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog
};