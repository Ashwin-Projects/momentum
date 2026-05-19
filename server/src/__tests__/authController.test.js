const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const app = require('../app');
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const expectSuccessResponse = (body) => {
  expect(body).toEqual(
    expect.objectContaining({
      success: true,
      data: expect.any(Object),
      message: expect.any(String)
    })
  );
};

describe('auth controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'ashwin@example.com'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('name is required');
    expect(res.body.error).toContain('password is required');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test('POST /api/auth/login returns 400 when field types are invalid', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ashwin@example.com',
      password: 123456
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('password must be a string');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('POST /api/auth/register creates user and returns standard response', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Ashwin',
      email: 'ashwin@example.com',
      password: 'hashed-password'
    });
    jwt.sign.mockReturnValue('signed-token');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Ashwin',
      email: 'ashwin@example.com',
      password: 'plaintext-password'
    });

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          password: 'hashed-password'
        })
      })
    );
    expectSuccessResponse(res.body);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login returns standard response for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Ashwin',
      email: 'ashwin@example.com',
      password: 'hashed-password'
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('signed-token');

    const res = await request(app).post('/api/auth/login').send({
      email: 'ashwin@example.com',
      password: 'plaintext-password'
    });

    expect(res.status).toBe(200);
    expectSuccessResponse(res.body);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/logout returns success and message', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      })
    );
  });

  test('POST /api/auth/login returns 429 after auth rate limit is exceeded', async () => {
    let finalResponse;

    for (let i = 0; i < 15; i += 1) {
      finalResponse = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: 'short'
      });
    }

    expect(finalResponse.status).toBe(429);
    expect(finalResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        error: 'Too many requests',
        code: 429
      })
    );
  });

  describe('GET /api/auth/me', () => {
    test('GET /api/auth/me returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    test('GET /api/auth/me returns 401 when token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid or expired token');
    });

    test('GET /api/auth/me returns user data with valid token', async () => {
      jwt.verify.mockResolvedValue({ id: 'user-1', email: 'ashwin@example.com' });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Ashwin',
        email: 'ashwin@example.com',
        created_at: new Date('2024-01-01')
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toEqual({
        id: 'user-1',
        name: 'Ashwin',
        email: 'ashwin@example.com',
        created_at: expect.any(String)
      });
    });

    test('GET /api/auth/me returns 404 when user not found', async () => {
      jwt.verify.mockResolvedValue({ id: 'non-existent-id', email: 'test@example.com' });
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=valid-token');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User not found');
    });
  });
});
