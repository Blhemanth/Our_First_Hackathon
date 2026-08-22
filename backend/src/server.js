const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const usersRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'Dayflow HRMS Backend REST API',
    timestamp: new Date().toISOString(),
  });
});

// Resource Routes
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Dayflow Backend Server running on http://localhost:${PORT}`);
  console.log(`📋 API routes loaded: /api/users, /api/attendance, /api/leave`);
});

module.exports = app;
