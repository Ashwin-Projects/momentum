const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authRateLimiter, generalRateLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(generalRateLimiter);
app.post('/api/auth/register', authRateLimiter);
app.post('/api/auth/login', authRateLimiter);

// Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const targetRoutes = require('./routes/targets');
const studyRoutes = require('./routes/study');
const workoutRoutes = require('./routes/workout');
const nutritionRoutes = require('./routes/nutrition');
const sleepRoutes = require('./routes/sleep');
const focusRoutes = require('./routes/focus');
const moodRoutes = require('./routes/mood');
const screenTimeRoutes = require('./routes/screentime');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const aiRoutes = require('./routes/ai');

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/screentime', screenTimeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Momentum API is running' });
});

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
