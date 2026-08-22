import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import usersRouter from './routes/users.js';
import leaveRouter from './routes/leave.js';
import attendanceRouter from './routes/attendance.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// User / Profile routes
app.use('/api/users', usersRouter);

// Leave Management routes
app.use('/api/leave', leaveRouter);

// Attendance routes
app.use('/api/attendance', attendanceRouter);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dayflow HRMS API',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 404 Fallback
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found.`,
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);

  res.status(500).json({
    error: 'Unexpected server error.',
  });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Dayflow API server running at http://localhost:${PORT}`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`📅 Leave API: http://localhost:${PORT}/api/leave`);
  console.log(`⏱️ Attendance API: http://localhost:${PORT}/api/attendance`);
});