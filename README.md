# Momentum
A full-stack productivity and performance tracking platform focused on helping users understand how they spend their time, energy, and attention throughout the day.
Momentum combines study tracking, workouts, nutrition, sleep, focus sessions, mood analysis, and screen time monitoring into a single analytics-driven dashboard with AI-powered planning support.

## Features
* Daily target management
* Study session tracking
* Workout logging
* Nutrition and calorie tracking
* Sleep monitoring
* Focus session analysis
* Mood tracking
* Screen time insights
* Productivity analytics dashboard
* AI planner and contextual recommendations
* JWT authentication with secure cookies
* Responsive dashboard UI

## Tech Stack
### Frontend
* React
* Vite
* TailwindCSS
* React Query
* Axios
* Recharts
* shadcn/ui

### Backend
* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication

### AI Integration
* Groq API
* Llama 3.1 Models

## Project Structure
Momentum/
│
├── client/          # React frontend
├── server/          # Express backend
│
├── CLAUDE.md
├── HANDOFF.md
└── README.md

## Current Modules
Momentum currently supports:
* Authentication
* Dashboard overview
* Daily targets
* Study tracking
* Workout tracking
* Nutrition tracking
* Sleep tracking
* Focus tracking
* Mood tracking
* Screen time tracking
* Analytics
* AI planner

## API Overview
Base URL:
http://localhost:3000/api

### Public Routes
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /health

### Protected Routes
/targets
/study
/workout
/nutrition
/sleep
/focus
/mood
/screentime
/analytics
/ai

## Environment Variables
### Backend (`server/.env`)
DATABASE_URL=
JWT_SECRET=
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

## Getting Started
### 1. Clone the repository
git clone <your-repo-url>
cd momentum

### 2. Install dependencies
Frontend:
cd client
npm install

Backend:
cd server
npm install

### 3. Setup database
cd server
npx prisma migrate dev

### 4. Start the development servers
Backend:
cd server
npm run dev

Frontend:
cd client
npm run dev

## Authentication
Momentum uses JWT authentication with HTTP-only cookies.
Protected routes require a valid `token` cookie generated during login or registration.

## Analytics
The analytics module currently includes:
* Productivity trends
* Study consistency
* Workout frequency
* Mood trends
* Focus score tracking
* Screen time breakdown
* Productivity scoring

## AI Planner
The AI planner uses contextual user activity data to generate productivity suggestions and planning assistance.
Current implementation uses:
* Groq API
* Llama 3.1 models

## Known Issues
* `auth/me` may fail due to `created_at` vs `createdAt` mismatch in the auth controller.
* `AIPlanner.jsx` currently expects a slightly different response shape from the backend.
* Frontend build produces a large chunk size warning.

## Future Improvements
* Better AI planning workflows
* More detailed analytics
* Notification system improvements
* Performance optimizations
* Frontend code splitting
* Export improvements

## Author
Ashwin Lakshminarasimhan

## License
This project is currently intended for educational and portfolio purposes.