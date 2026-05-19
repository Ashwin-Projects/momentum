const prisma = require('../utils/prisma');
const { getStartOfDay, syncDailyTargetActuals } = require('../services/dailyTargetSyncService');

// GET - Get all workout logs for user
const getWorkouts = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const userId = req.user.id;

    const where = { userId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.completedAt = { gte: startOfDay, lte: endOfDay };
    } else if (startDate && endDate) {
      where.completedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const workouts = await prisma.workoutLog.findMany({
      where,
      orderBy: { completedAt: 'desc' }
    });

    res.json({
      success: true,
      data: workouts,
      message: 'Workouts retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST - Create a new workout log
const createWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, durationMinutes, caloriesBurned, notes, completedAt, dailyTargetId } = req.body;

    if (!type || !durationMinutes || !completedAt) {
      return res.status(400).json({
        success: false,
        error: 'Type, durationMinutes, and completedAt are required'
      });
    }

    const workoutDate = new Date(completedAt);

    const workout = await prisma.workoutLog.create({
      data: {
        userId,
        type,
        durationMinutes,
        caloriesBurned: caloriesBurned || null,
        notes: notes || null,
        completedAt: workoutDate,
        dailyTargetId: dailyTargetId || null
      }
    });

    await syncDailyTargetActuals(userId, workoutDate);

    res.status(201).json({
      success: true,
      data: workout,
      message: 'Workout logged successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH - Update a workout log
const updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.workoutLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }

    const { type, durationMinutes, caloriesBurned, notes, completedAt } = req.body;

    const previousDate = existing.completedAt;

    const workout = await prisma.workoutLog.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(caloriesBurned !== undefined && { caloriesBurned }),
        ...(notes !== undefined && { notes }),
        ...(completedAt !== undefined && { completedAt: new Date(completedAt) })
      }
    });

    await syncDailyTargetActuals(userId, previousDate);
    if (getStartOfDay(previousDate).getTime() !== getStartOfDay(workout.completedAt).getTime()) {
      await syncDailyTargetActuals(userId, workout.completedAt);
    }

    res.json({
      success: true,
      data: workout,
      message: 'Workout updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE - Delete a workout log
const deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.workoutLog.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }

    await prisma.workoutLog.delete({ where: { id } });
    await syncDailyTargetActuals(userId, existing.completedAt);

    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getWorkouts, createWorkout, updateWorkout, deleteWorkout };
