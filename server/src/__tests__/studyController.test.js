const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  studySession: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  workoutLog: {
    count: jest.fn()
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

describe('study controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
    prisma.studySession.aggregate.mockResolvedValue({ _sum: { durationMinutes: 0 } });
    prisma.workoutLog.count.mockResolvedValue(0);
    prisma.nutritionLog.aggregate.mockResolvedValue({ _sum: { calories: 0 } });
    prisma.dailyTarget.upsert.mockResolvedValue({ id: 't1' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/study');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/study returns only current user records', async () => {
    prisma.studySession.findMany.mockResolvedValue([{ id: 's1', userId: 'user-1' }]);

    const res = await request(app).get('/api/study').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.studySession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/study creates a record and returns standard response', async () => {
    prisma.studySession.create.mockResolvedValue({ id: 's1', userId: 'user-1' });

    const res = await request(app).post('/api/study').set('Cookie', authCookie).send({
      subject: 'DAA',
      durationMinutes: 90,
      startedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.studySession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/study/:id updates only if record belongs to req.user.id', async () => {
    prisma.studySession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/study/s1')
      .set('Cookie', authCookie)
      .send({ subject: 'OS' });

    expect(res.status).toBe(404);
    expect(prisma.studySession.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/study/:id returns standard response when owned', async () => {
    prisma.studySession.findFirst.mockResolvedValue({ id: 's1', userId: 'user-1' });
    prisma.studySession.update.mockResolvedValue({ id: 's1', userId: 'user-1', subject: 'OS' });

    const res = await request(app)
      .patch('/api/study/s1')
      .set('Cookie', authCookie)
      .send({ subject: 'OS' });

    expect(res.status).toBe(200);
    expect(prisma.studySession.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/study/:id deletes only if record belongs to req.user.id', async () => {
    prisma.studySession.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/study/s1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.studySession.delete).not.toHaveBeenCalled();
  });
});
