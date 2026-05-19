const prisma = require('../utils/prisma');

// GET - Get all targets for user (or by date)
const getTargets = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    const targets = await prisma.dailyTarget.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      data: targets,
      message: 'Targets retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new target
const createTarget = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      studyMinutesGoal,
      workoutGoal,
      caloriesGoal,
      sleepHoursGoal
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if target already exists for this user and date
    const existing = await prisma.dailyTarget.findFirst({
      where: {
        userId,
        date: targetDate
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Target for this date already exists'
      });
    }

    const target = await prisma.dailyTarget.create({
      data: {
        userId,
        date: targetDate,
        studyMinutesGoal: studyMinutesGoal || 0,
        workoutGoal: workoutGoal || 0,
        caloriesGoal: caloriesGoal || 0,
        sleepHoursGoal: sleepHoursGoal || 0
      }
    });

    res.status(201).json({
      success: true,
      data: target,
      message: 'Target created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a target
const updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.dailyTarget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Target not found' });
    }

    const {
      studyMinutesGoal,
      workoutGoal,
      caloriesGoal,
      sleepHoursGoal,
      studyMinutesActual,
      workoutsCompleted,
      caloriesActual,
      sleepHoursActual
    } = req.body;

    const target = await prisma.dailyTarget.update({
      where: { id },
      data: {
        ...(studyMinutesGoal !== undefined && { studyMinutesGoal }),
        ...(workoutGoal !== undefined && { workoutGoal }),
        ...(caloriesGoal !== undefined && { caloriesGoal }),
        ...(sleepHoursGoal !== undefined && { sleepHoursGoal }),
        ...(studyMinutesActual !== undefined && { studyMinutesActual }),
        ...(workoutsCompleted !== undefined && { workoutsCompleted }),
        ...(caloriesActual !== undefined && { caloriesActual }),
        ...(sleepHoursActual !== undefined && { sleepHoursActual })
      }
    });

    res.json({
      success: true,
      data: target,
      message: 'Target updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a target
const deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.dailyTarget.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Target not found' });
    }

    await prisma.dailyTarget.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Target deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getTargets, createTarget, updateTarget, deleteTarget };