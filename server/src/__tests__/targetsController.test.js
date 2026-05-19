const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  dailyTarget: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
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

describe('targets controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/targets');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/targets returns only current user records', async () => {
    prisma.dailyTarget.findMany.mockResolvedValue([{ id: 't1', userId: 'user-1' }]);

    const res = await request(app).get('/api/targets').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.dailyTarget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/targets creates a record and returns standard response', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);
    prisma.dailyTarget.create.mockResolvedValue({ id: 't1', userId: 'user-1' });

    const res = await request(app).post('/api/targets').set('Cookie', authCookie).send({
      date: '2026-05-14'
    });

    expect(res.status).toBe(201);
    expect(prisma.dailyTarget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/targets/:id updates only if record belongs to req.user.id', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/targets/t1')
      .set('Cookie', authCookie)
      .send({ studyMinutesGoal: 120 });

    expect(res.status).toBe(404);
    expect(prisma.dailyTarget.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/targets/:id returns standard response when owned', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue({ id: 't1', userId: 'user-1' });
    prisma.dailyTarget.update.mockResolvedValue({ id: 't1', userId: 'user-1', studyMinutesGoal: 120 });

    const res = await request(app)
      .patch('/api/targets/t1')
      .set('Cookie', authCookie)
      .send({ studyMinutesGoal: 120 });

    expect(res.status).toBe(200);
    expect(prisma.dailyTarget.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/targets/:id deletes only if record belongs to req.user.id', async () => {
    prisma.dailyTarget.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/targets/t1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.dailyTarget.delete).not.toHaveBeenCalled();
  });
});
