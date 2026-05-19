const rateLimit = require('express-rate-limit');

const limiterResponse = {
  success: false,
  error: 'Too many requests',
  code: 429
};

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterResponse
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === 'POST' &&
    (req.path === '/api/auth/register' || req.path === '/api/auth/login'),
  message: limiterResponse
});

module.exports = {
  authRateLimiter,
  generalRateLimiter
};
