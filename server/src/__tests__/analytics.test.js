const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  studySession: { findMany: jest.fn() },
  workoutLog: { findMany: jest.fn() },
  dailyTarget: { findMany: jest.fn() },
  nutritionLog: { findMany: jest.fn() },
  focusSession: { findMany: jest.fn() },
  moodLog: { findMany: jest.fn() },
  screenTimeLog: { findMany: jest.fn() }
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

const app = require('../app');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');

const authCookie = 'token=valid-token';

const expectSuccessResponse = (body) => {
  expect(body).toEqual(
    expect.objectContaining({
      success: true,
      data: expect.anything(),
      message: expect.any(String)
    })
  );
};

describe('analytics endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });

    prisma.studySession.findMany.mockResolvedValue([]);
    prisma.workoutLog.findMany.mockResolvedValue([]);
    prisma.dailyTarget.findMany.mockResolvedValue([]);
    prisma.nutritionLog.findMany.mockResolvedValue([]);
    prisma.focusSession.findMany.mockResolvedValue([]);
    prisma.moodLog.findMany.mockResolvedValue([]);
    prisma.screenTimeLog.findMany.mockResolvedValue([]);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/analytics/summary');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/analytics/summary returns all 7 analytics sections', async () => {
    prisma.studySession.findMany.mockResolvedValue([
      { subject: 'DAA', durationMinutes: 120, startedAt: '2026-05-13T08:00:00.000Z' }
    ]);
    prisma.workoutLog.findMany.mockResolvedValue([
      { type: 'strength', caloriesBurned: 350, completedAt: '2026-05-13T18:00:00.000Z' }
    ]);
    prisma.dailyTarget.findMany.mockResolvedValue([{ sleepHoursActual: 7, sleepHoursGoal: 8, date: '2026-05-13' }]);
    prisma.nutritionLog.findMany.mockResolvedValue([
      {
        loggedAt: '2026-05-13T12:00:00.000Z',
        calories: 650,
        proteinGrams: 35,
        carbsGrams: 70,
        fatGrams: 18
      }
    ]);
    prisma.focusSession.findMany.mockResolvedValue([
      { focusScore: 9, distractionsCount: 1, durationMinutes: 90, startedAt: '2026-05-13T09:00:00.000Z' }
    ]);
    prisma.moodLog.findMany.mockResolvedValue([
      { mood: 'good', energyLevel: 8, stressLevel: 4, loggedAt: '2026-05-13T20:00:00.000Z' }
    ]);
    prisma.screenTimeLog.findMany.mockResolvedValue([
      { category: 'productive', durationMinutes: 80, loggedAt: '2026-05-13T16:00:00.000Z' }
    ]);

    const res = await request(app).get('/api/analytics/summary').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expectSuccessResponse(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        weeklyStudySummary: expect.any(Object),
        workoutFrequency: expect.any(Object),
        sleepAnalysis: expect.any(Object),
        nutritionSummary: expect.any(Object),
        focusAnalysis: expect.any(Object),
        moodTrends: expect.any(Object),
        screenTimeBreakdown: expect.any(Object)
      })
    );
    expect(prisma.studySession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
  });

  test('GET /api/analytics/trends returns time series data', async () => {
    prisma.studySession.findMany.mockResolvedValue([
      { startedAt: '2026-05-13T08:00:00.000Z', durationMinutes: 120 }
    ]);
    prisma.workoutLog.findMany.mockResolvedValue([
      { completedAt: '2026-05-13T18:00:00.000Z', caloriesBurned: 350 }
    ]);
    prisma.dailyTarget.findMany.mockResolvedValue([
      { date: '2026-05-13', sleepHoursActual: 7, sleepHoursGoal: 8 }
    ]);
    prisma.nutritionLog.findMany.mockResolvedValue([
      { loggedAt: '2026-05-13T12:00:00.000Z', calories: 650 }
    ]);
    prisma.focusSession.findMany.mockResolvedValue([
      { startedAt: '2026-05-13T09:00:00.000Z', focusScore: 9, distractionsCount: 1, durationMinutes: 90 }
    ]);
    prisma.moodLog.findMany.mockResolvedValue([
      { loggedAt: '2026-05-13T20:00:00.000Z', mood: 'good', energyLevel: 8, stressLevel: 4 }
    ]);
    prisma.screenTimeLog.findMany.mockResolvedValue([
      { loggedAt: '2026-05-13T16:00:00.000Z', category: 'productive', durationMinutes: 80 }
    ]);

    const res = await request(app).get('/api/analytics/trends').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expectSuccessResponse(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        studyMinutesByDay: expect.any(Array),
        workoutsByDay: expect.any(Array),
        sleepByDay: expect.any(Array),
        nutritionCaloriesByDay: expect.any(Array),
        focusByDay: expect.any(Array),
        moodByDay: expect.any(Array),
        screenTimeByDay: expect.any(Array)
      })
    );
  });

  test('GET /api/analytics/summary returns empty analytics gracefully when no logs exist', async () => {
    const res = await request(app).get('/api/analytics/summary').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expectSuccessResponse(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        weeklyStudySummary: {
          totalMinutes: 0,
          averagePerDay: 0,
          mostStudiedSubject: null
        },
        workoutFrequency: {
          totalWorkouts: 0,
          totalCaloriesBurned: 0,
          mostCommonWorkoutType: null
        },
        sleepAnalysis: {
          averageDuration: 0,
          averageQuality: 0,
          consistencyScore: 100
        },
        nutritionSummary: {
          averageDailyCalories: 0,
          averageProtein: 0,
          averageCarbs: 0,
          averageFat: 0
        },
        focusAnalysis: {
          averageFocusScore: 0,
          averageDistractions: 0,
          totalDeepWorkMinutes: 0
        },
        moodTrends: {
          averageMood: 0,
          averageEnergy: 0,
          averageStress: 0
        },
        screenTimeBreakdown: {
          productive: 0,
          distracting: 0,
          neutral: 0,
          totalMinutes: 0
        }
      })
    );
  });

  test('GET /api/analytics/trends returns empty series gracefully when no logs exist', async () => {
    const res = await request(app).get('/api/analytics/trends').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expectSuccessResponse(res.body);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        studyMinutesByDay: [],
        workoutsByDay: [],
        sleepByDay: [],
        nutritionCaloriesByDay: [],
        focusByDay: [],
        moodByDay: [],
        screenTimeByDay: []
      })
    );
  });
});
