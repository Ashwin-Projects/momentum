const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  studySession: {
    aggregate: jest.fn()
  },
  workoutLog: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  nutritionLog: {
    aggregate: jest.fn()
  },
  dailyTarget: {
    upsert: jest.fn()
  }
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

describe('workout controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
    prisma.studySession.aggregate.mockResolvedValue({ _sum: { durationMinutes: 0 } });
    prisma.workoutLog.count.mockResolvedValue(0);
    prisma.nutritionLog.aggregate.mockResolvedValue({ _sum: { calories: 0 } });
    prisma.dailyTarget.upsert.mockResolvedValue({ id: 't1' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/workout');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/workout returns only current user records', async () => {
    prisma.workoutLog.findMany.mockResolvedValue([{ id: 'w1', userId: 'user-1' }]);

    const res = await request(app).get('/api/workout').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.workoutLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/workout creates a record and returns standard response', async () => {
    prisma.workoutLog.create.mockResolvedValue({ id: 'w1', userId: 'user-1' });

    const res = await request(app).post('/api/workout').set('Cookie', authCookie).send({
      type: 'chest',
      durationMinutes: 60,
      completedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.workoutLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/workout/:id updates only if record belongs to req.user.id', async () => {
    prisma.workoutLog.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/workout/w1')
      .set('Cookie', authCookie)
      .send({ type: 'legs' });

    expect(res.status).toBe(404);
    expect(prisma.workoutLog.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/workout/:id returns standard response when owned', async () => {
    prisma.workoutLog.findFirst.mockResolvedValue({ id: 'w1', userId: 'user-1' });
    prisma.workoutLog.update.mockResolvedValue({ id: 'w1', userId: 'user-1', type: 'legs' });

    const res = await request(app)
      .patch('/api/workout/w1')
      .set('Cookie', authCookie)
      .send({ type: 'legs' });

    expect(res.status).toBe(200);
    expect(prisma.workoutLog.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/workout/:id deletes only if record belongs to req.user.id', async () => {
    prisma.workoutLog.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/workout/w1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.workoutLog.delete).not.toHaveBeenCalled();
  });
});
