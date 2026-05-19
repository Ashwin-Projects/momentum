const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  screenTimeLog: {
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

describe('screentime controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/screentime');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/screentime returns only current user records', async () => {
    prisma.screenTimeLog.findMany.mockResolvedValue([{ id: 'st1', userId: 'user-1' }]);

    const res = await request(app).get('/api/screentime').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.screenTimeLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/screentime creates a record and returns standard response', async () => {
    prisma.screenTimeLog.create.mockResolvedValue({ id: 'st1', userId: 'user-1' });

    const res = await request(app).post('/api/screentime').set('Cookie', authCookie).send({
      appName: 'YouTube',
      durationMinutes: 45,
      category: 'entertainment',
      loggedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.screenTimeLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('PATCH /api/screentime/:id updates only if record belongs to req.user.id', async () => {
    prisma.screenTimeLog.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/screentime/st1')
      .set('Cookie', authCookie)
      .send({ durationMinutes: 40 });

    expect(res.status).toBe(404);
    expect(prisma.screenTimeLog.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/screentime/:id returns standard response when owned', async () => {
    prisma.screenTimeLog.findFirst.mockResolvedValue({ id: 'st1', userId: 'user-1' });
    prisma.screenTimeLog.update.mockResolvedValue({ id: 'st1', userId: 'user-1', durationMinutes: 40 });

    const res = await request(app)
      .patch('/api/screentime/st1')
      .set('Cookie', authCookie)
      .send({ durationMinutes: 40 });

    expect(res.status).toBe(200);
    expect(prisma.screenTimeLog.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/screentime/:id deletes only if record belongs to req.user.id', async () => {
    prisma.screenTimeLog.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/screentime/st1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.screenTimeLog.delete).not.toHaveBeenCalled();
  });
});
