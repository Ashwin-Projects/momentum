const request = require('supertest');

jest.mock('../utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const app = require('../app');
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mockUser = {
  id: 'user-1',
  name: 'Ashwin',
  email: 'ashwin@example.com',
  password: 'hashed-password',
  created_at: new Date('2024-01-01')
};

describe('profile controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockResolvedValue({ id: 'user-1', email: 'ashwin@example.com' });
  });

  const validToken = 'valid-token';

  describe('GET /api/profile', () => {
    test('GET /api/profile returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Authentication required');
    });

    test('GET /api/profile returns user profile with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Ashwin',
        email: 'ashwin@example.com',
        created_at: new Date('2024-01-01')
      });

      const res = await request(app)
        .get('/api/profile')
        .set('Cookie', `token=${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toEqual({
        id: 'user-1',
        name: 'Ashwin',
        email: 'ashwin@example.com',
        created_at: expect.any(String)
      });
    });

    test('GET /api/profile returns 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/profile')
        .set('Cookie', `token=${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('PATCH /api/profile', () => {
    test('PATCH /api/profile returns 401 when no token provided', async () => {
      const res = await request(app).patch('/api/profile').send({
        name: 'New Name'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('PATCH /api/profile updates name successfully', async () => {
      let callCount = 0;
      prisma.user.findUnique.mockImplementation((args) => {
        if (callCount === 0) {
          callCount += 1;
          return Promise.resolve(mockUser);
        }
        return Promise.resolve({ ...mockUser, name: 'New Name' });
      });
      prisma.user.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

      const res = await request(app)
        .patch('/api/profile')
        .set('Cookie', `token=${validToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('New Name');
    });

    test('PATCH /api/profile updates email successfully', async () => {
      let callCount = 0;
      prisma.user.findUnique.mockImplementation((args) => {
        if (callCount === 0) {
          callCount += 1;
          return Promise.resolve(mockUser);
        }
        if (args.where.email === 'newemail@example.com') {
          return Promise.resolve(null);
        }
        return Promise.resolve(mockUser);
      });
      prisma.user.update.mockResolvedValue({ ...mockUser, email: 'newemail@example.com' });

      const res = await request(app)
        .patch('/api/profile')
        .set('Cookie', `token=${validToken}`)
        .send({ email: 'newemail@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newemail@example.com');
    });

    test('PATCH /api/profile returns 400 when email is already in use', async () => {
      let callCount = 0;
      prisma.user.findUnique.mockImplementation((args) => {
        if (callCount === 0) {
          callCount += 1;
          return Promise.resolve(mockUser);
        }
        if (args.where.email === 'taken@example.com') {
          return Promise.resolve({ id: 'other-user', email: 'taken@example.com' });
        }
        return Promise.resolve(null);
      });

      const res = await request(app)
        .patch('/api/profile')
        .set('Cookie', `token=${validToken}`)
        .send({ email: 'taken@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email already in use');
    });

    test('PATCH /api/profile returns 400 for invalid email format', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Cookie', `token=${validToken}`)
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('email must be a valid email');
    });

    test('PATCH /api/profile returns 400 for empty name', async () => {
      const res = await request(app)
        .patch('/api/profile')
        .set('Cookie', `token=${validToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('name cannot be empty');
    });
  });

  describe('PATCH /api/profile/password', () => {
    test('PATCH /api/profile/password returns 401 when no token provided', async () => {
      const res = await request(app).patch('/api/profile/password').send({
        currentPassword: 'old-password',
        newPassword: 'new-password123'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('PATCH /api/profile/password returns 400 when current password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .patch('/api/profile/password')
        .set('Cookie', `token=${validToken}`)
        .send({
          currentPassword: 'wrong-password',
          newPassword: 'new-password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Current password is incorrect');
    });

    test('PATCH /api/profile/password returns 400 when new password is too short', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .patch('/api/profile/password')
        .set('Cookie', `token=${validToken}`)
        .send({
          currentPassword: 'correct-password',
          newPassword: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('new password must be at least 6 characters long');
    });

    test('PATCH /api/profile/password returns 400 when current password is missing', async () => {
      const res = await request(app)
        .patch('/api/profile/password')
        .set('Cookie', `token=${validToken}`)
        .send({
          newPassword: 'new-password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('current password is required');
    });

    test('PATCH /api/profile/password returns 400 when new password is missing', async () => {
      const res = await request(app)
        .patch('/api/profile/password')
        .set('Cookie', `token=${validToken}`)
        .send({
          currentPassword: 'old-password'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('new password is required');
    });

    test('PATCH /api/profile/password updates password successfully', async () => {
      jwt.verify.mockResolvedValue({ id: 'user-1', email: 'ashwin@example.com' });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('new-hashed-password');
      prisma.user.update.mockResolvedValue({ ...mockUser, password: 'new-hashed-password' });

      const res = await request(app)
        .patch('/api/profile/password')
        .set('Cookie', `token=${validToken}`)
        .send({
          currentPassword: 'correct-password',
          newPassword: 'new-password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password updated successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password123', 10);
    });
  });
});