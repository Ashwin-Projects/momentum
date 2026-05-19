const prisma = require('../utils/prisma');

// GET - Get all focus sessions for user
const getFocusSessions = async (req, res) => {
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

    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { startedAt: 'desc' }
    });

    res.json({
      success: true,
      data: sessions,
      message: 'Focus sessions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new focus session
const createFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskName, durationMinutes, focusScore, distractionsCount, notes, startedAt, dailyTargetId } = req.body;

    if (!taskName || !durationMinutes || !startedAt) {
      return res.status(400).json({
        success: false,
        error: 'taskName, durationMinutes, and startedAt are required'
      });
    }

    const session = await prisma.focusSession.create({
      data: {
        userId,
        taskName,
        durationMinutes,
        focusScore: focusScore || 5,
        distractionsCount: distractionsCount || 0,
        notes: notes || null,
        startedAt: new Date(startedAt),
        dailyTargetId: dailyTargetId || null
      }
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Focus session created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a focus session
const updateFocusSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.focusSession.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Focus session not found' });
    }

    const { taskName, durationMinutes, focusScore, distractionsCount, notes, startedAt } = req.body;

    const session = await prisma.focusSession.update({
      where: { id },
      data: {
        ...(taskName !== undefined && { taskName }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(focusScore !== undefined && { focusScore }),
        ...(distractionsCount !== undefined && { distractionsCount }),
        ...(notes !== undefined && { notes }),
        ...(startedAt !== undefined && { startedAt: new Date(startedAt) })
      }
    });

    res.json({
      success: true,
      data: session,
      message: 'Focus session updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a focus session
const deleteFocusSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.focusSession.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Focus session not found' });
    }

    await prisma.focusSession.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Focus session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getFocusSessions,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession
};