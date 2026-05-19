const prisma = require('../utils/prisma');
const { getStartOfDay, syncDailyTargetActuals } = require('../services/dailyTargetSyncService');

// GET - Get all study sessions for user
const getStudySessions = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startedAt = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.startedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const sessions = await prisma.studySession.findMany({
      where,
      orderBy: { startedAt: 'desc' }
    });

    res.json({
      success: true,
      data: sessions,
      message: 'Study sessions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new study session
const createStudySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, durationMinutes, notes, startedAt, dailyTargetId } = req.body;

    if (!subject || !durationMinutes || !startedAt) {
      return res.status(400).json({
        success: false,
        error: 'Subject, durationMinutes, and startedAt are required'
      });
    }

    const sessionDate = new Date(startedAt);

    const session = await prisma.studySession.create({
      data: {
        userId,
        subject,
        durationMinutes,
        notes: notes || null,
        startedAt: sessionDate,
        dailyTargetId: dailyTargetId || null
      }
    });

    await syncDailyTargetActuals(userId, sessionDate);

    res.status(201).json({
      success: true,
      data: session,
      message: 'Study session created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a study session
const updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.studySession.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Study session not found' });
    }

    const { subject, durationMinutes, notes, startedAt } = req.body;

    const previousDate = existing.startedAt;

    const session = await prisma.studySession.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(notes !== undefined && { notes }),
        ...(startedAt !== undefined && { startedAt: new Date(startedAt) })
      }
    });

    await syncDailyTargetActuals(userId, previousDate);
    if (getStartOfDay(previousDate).getTime() !== getStartOfDay(session.startedAt).getTime()) {
      await syncDailyTargetActuals(userId, session.startedAt);
    }

    res.json({
      success: true,
      data: session,
      message: 'Study session updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a study session
const deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.studySession.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Study session not found' });
    }

    await prisma.studySession.delete({ where: { id } });
    await syncDailyTargetActuals(userId, existing.startedAt);

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getStudySessions,
  createStudySession,
  updateStudySession,
  deleteStudySession
};
