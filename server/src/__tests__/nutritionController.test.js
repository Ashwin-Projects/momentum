const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  studySession: {
    aggregate: jest.fn()
  },
  workoutLog: {
    count: jest.fn()
  },
  nutritionLog: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
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

describe('nutrition controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
    prisma.studySession.aggregate.mockResolvedValue({ _sum: { durationMinutes: 0 } });
    prisma.workoutLog.count.mockResolvedValue(0);
    prisma.nutritionLog.aggregate.mockResolvedValue({ _sum: { calories: 0 } });
    prisma.dailyTarget.upsert.mockResolvedValue({ id: 't1' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/nutrition');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/nutrition returns only current user records', async () => {
    prisma.nutritionLog.findMany.mockResolvedValue([{ id: 'n1', userId: 'user-1' }]);

    const res = await request(app).get('/api/nutrition').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.nutritionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/nutrition creates a record and returns standard response', async () => {
    prisma.nutritionLog.create.mockResolvedValue({ id: 'n1', userId: 'user-1' });

    const res = await request(app).post('/api/nutrition').set('Cookie', authCookie).send({
      mealType: 'lunch',
      foodName: 'rice',
      calories: 500,
      loggedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.nutritionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/nutrition/:id updates only if record belongs to req.user.id', async () => {
    prisma.nutritionLog.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/nutrition/n1')
      .set('Cookie', authCookie)
      .send({ calories: 450 });

    expect(res.status).toBe(404);
    expect(prisma.nutritionLog.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/nutrition/:id returns standard response when owned', async () => {
    prisma.nutritionLog.findFirst.mockResolvedValue({ id: 'n1', userId: 'user-1' });
    prisma.nutritionLog.update.mockResolvedValue({ id: 'n1', userId: 'user-1', calories: 450 });

    const res = await request(app)
      .patch('/api/nutrition/n1')
      .set('Cookie', authCookie)
      .send({ calories: 450 });

    expect(res.status).toBe(200);
    expect(prisma.nutritionLog.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/nutrition/:id deletes only if record belongs to req.user.id', async () => {
    prisma.nutritionLog.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/nutrition/n1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.nutritionLog.delete).not.toHaveBeenCalled();
  });
});
