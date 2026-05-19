const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  focusSession: {
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

describe('focus controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ id: 'user-1', email: 'u1@example.com' });
  });

  test('protected route returns 401 without valid token', async () => {
    const res = await request(app).get('/api/focus');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/focus returns only current user records', async () => {
    prisma.focusSession.findMany.mockResolvedValue([{ id: 'f1', userId: 'user-1' }]);

    const res = await request(app).get('/api/focus').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(prisma.focusSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/focus creates a record and returns standard response', async () => {
    prisma.focusSession.create.mockResolvedValue({ id: 'f1', userId: 'user-1' });

    const res = await request(app).post('/api/focus').set('Cookie', authCookie).send({
      taskName: 'Algorithms revision',
      durationMinutes: 50,
      startedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(201);
    expect(prisma.focusSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1' })
      })
    );
    expectSuccessResponse(res.body);
  });

  test('POST /api/focus returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/focus').set('Cookie', authCookie).send({
      durationMinutes: 50,
      startedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('taskName is required');
    expect(prisma.focusSession.create).not.toHaveBeenCalled();
  });

  test('POST /api/focus returns 400 when field types are invalid', async () => {
    const res = await request(app).post('/api/focus').set('Cookie', authCookie).send({
      taskName: 123,
      durationMinutes: 'forty-five',
      startedAt: '2026-05-14T10:00:00.000Z'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('taskName must be a string');
    expect(res.body.error).toContain('durationMinutes must be an integer greater than 0');
    expect(prisma.focusSession.create).not.toHaveBeenCalled();
  });

  test('POST /api/focus returns 400 when values are out of range', async () => {
    const res = await request(app).post('/api/focus').set('Cookie', authCookie).send({
      taskName: 'Algorithms revision',
      durationMinutes: 50,
      startedAt: '2026-05-14T10:00:00.000Z',
      focusScore: 11
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('focusScore must be an integer between 1 and 10');
    expect(prisma.focusSession.create).not.toHaveBeenCalled();
  });

  test('PATCH /api/focus/:id updates only if record belongs to req.user.id', async () => {
    prisma.focusSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/focus/f1')
      .set('Cookie', authCookie)
      .send({ focusScore: 9 });

    expect(res.status).toBe(404);
    expect(prisma.focusSession.update).not.toHaveBeenCalled();
  });

  test('PATCH /api/focus/:id returns standard response when owned', async () => {
    prisma.focusSession.findFirst.mockResolvedValue({ id: 'f1', userId: 'user-1' });
    prisma.focusSession.update.mockResolvedValue({ id: 'f1', userId: 'user-1', focusScore: 9 });

    const res = await request(app)
      .patch('/api/focus/f1')
      .set('Cookie', authCookie)
      .send({ focusScore: 9 });

    expect(res.status).toBe(200);
    expect(prisma.focusSession.update).toHaveBeenCalled();
    expectSuccessResponse(res.body);
  });

  test('DELETE /api/focus/:id deletes only if record belongs to req.user.id', async () => {
    prisma.focusSession.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/focus/f1').set('Cookie', authCookie);

    expect(res.status).toBe(404);
    expect(prisma.focusSession.delete).not.toHaveBeenCalled();
  });
});
