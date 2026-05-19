const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  dailyTarget: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn()
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

describe('sleep controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/sleep');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/sleep returns only current user records', async () => {
    prisma.dailyTarget.findMany.mockResolvedValue([{ id: 'sl1', userId: 'user-1' }]);

    const res = await request(app).get('/api/sleep').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.dailyTarget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/sleep creates a record and returns standard response', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);
    prisma.dailyTarget.create.mockResolvedValue({ id: 'sl1', userId: 'user-1' });

    const res = await request(app).post('/api/sleep').set('Cookie', authCookie).send({
      date: '2026-05-14',
      sleepHoursGoal: 8,
      sleepHoursActual: 7
    });

    expect(res.status).toBe(201);
    expect(prisma.dailyTarget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/sleep/:id updates only if record belongs to req.user.id', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/sleep/sl1')
      .set('Cookie', authCookie)
      .send({ sleepHoursActual: 6.5 });

    expect(res.status).toBe(404);
    expect(prisma.dailyTarget.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/sleep/:id returns standard response when owned', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue({ id: 'sl1', userId: 'user-1' });
    prisma.dailyTarget.update.mockResolvedValue({ id: 'sl1', userId: 'user-1', sleepHoursActual: 6.5 });

    const res = await request(app)
      .patch('/api/sleep/sl1')
      .set('Cookie', authCookie)
      .send({ sleepHoursActual: 6.5 });

    expect(res.status).toBe(200);
    expect(prisma.dailyTarget.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/sleep/:id only updates reset values if record belongs to req.user.id', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/sleep/sl1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.dailyTarget.update).not.toHaveBeenCalled();
  });
});
