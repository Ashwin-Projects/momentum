const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  moodLog: {
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

describe('mood controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/mood');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/mood returns only current user records', async () => {
    prisma.moodLog.findMany.mockResolvedValue([{ id: 'm1', userId: 'user-1' }]);

    const res = await request(app).get('/api/mood').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.moodLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/mood creates a record and returns standard response', async () => {
    prisma.moodLog.create.mockResolvedValue({ id: 'm1', userId: 'user-1' });

    const res = await request(app).post('/api/mood').set('Cookie', authCookie).send({
      mood: 'happy',
      loggedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.moodLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/mood/:id updates only if record belongs to req.user.id', async () => {
    prisma.moodLog.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/mood/m1')
      .set('Cookie', authCookie)
      .send({ mood: 'calm' });

    expect(res.status).toBe(404);
    expect(prisma.moodLog.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/mood/:id returns standard response when owned', async () => {
    prisma.moodLog.findFirst.mockResolvedValue({ id: 'm1', userId: 'user-1' });
    prisma.moodLog.update.mockResolvedValue({ id: 'm1', userId: 'user-1', mood: 'calm' });

    const res = await request(app)
      .patch('/api/mood/m1')
      .set('Cookie', authCookie)
      .send({ mood: 'calm' });

    expect(res.status).toBe(200);
    expect(prisma.moodLog.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/mood/:id deletes only if record belongs to req.user.id', async () => {
    prisma.moodLog.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/mood/m1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.moodLog.delete).not.toHaveBeenCalled();
  });
});
