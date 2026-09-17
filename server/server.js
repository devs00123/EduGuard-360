require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
require('./models');
const { initSocket } = require('./services/socketService');
const { checkSlaBreaches } = require('./services/slaService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const interventionRoutes = require('./routes/interventionRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const searchRoutes = require('./routes/searchRoutes');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB().catch(err => {
  console.error('[Server] Fatal MongoDB connection error:', err);
});

// Initialize Socket.IO
initSocket(server);

// Security Headers with relaxed CSP for CDN libraries and Google Identity Services
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:*", "http://127.0.0.1:*", "https://*.googleusercontent.com", "https://accounts.google.com", "https://ssl.gstatic.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      mediaSrc: ["'self'", "data:", "blob:"],
      connectSrc: [
        "'self'",
        "ws:",
        "wss:",
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://accounts.google.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Specific Rate Limiters for sensitive/high-cost endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40, // 40 AI queries per min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI query rate limit exceeded, please wait a moment.' }
});

const complaintLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 complaints per min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Complaint submission limit exceeded, please try again shortly.' }
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // 100 queries per min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Search rate limit exceeded.' }
});

// Static Asset Directories
app.use('/student', express.static(path.resolve(__dirname, '../login user')));
app.use('/staff', express.static(path.resolve(__dirname, '../login admin')));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
app.use(express.static(path.resolve(__dirname, '../public')));

// Authentication Portals & Direct Routes
app.get('/student/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../login user/index.html'));
});
app.get('/student/register', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../login user/register.html'));
});
app.get('/staff/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../login admin/admin-login.html'));
});
app.get('/staff/register', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../login admin/admin-register.html'));
});
app.get('/portal', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/portal.html'));
});
app.get('/login', (req, res) => {
  res.redirect('/student/login');
});
app.get(['/student/dashboard', '/faculty/dashboard', '/staff/dashboard', '/department-head/dashboard', '/admin/dashboard'], (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/complaints', complaintLimiter, complaintRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchLimiter, searchRoutes);

// Health check endpoint (Secured for production)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const isDev = process.env.NODE_ENV === 'development';

  // Check if caller provides admin auth token
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(
        authHeader.split(' ')[1],
        process.env.JWT_SECRET || 'eduguard360_super_secret_jwt_key_hackathon_2026_secure'
      );
      if (decoded && decoded.role === 'ADMIN') isAdmin = true;
    } catch (_) {}
  }

  // In production, public health check returns only safe minimal status
  if (!isDev && !isAdmin) {
    return res.json({
      status: isConnected ? 'ok' : 'degraded',
      database: isConnected ? 'connected' : 'disconnected'
    });
  }

  // Detailed diagnostics for development or authenticated administrators only
  res.json({
    status: isConnected ? 'ok' : 'degraded',
    database: isConnected ? 'connected' : 'disconnected',
    environment: isDev ? 'development' : 'production',
    demoMode: process.env.DEMO_MODE === 'true',
    platform: 'EduGuard 360',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Periodic SLA Breach Checker (runs every 60 seconds)
setInterval(async () => {
  try {
    const breached = await checkSlaBreaches();
    if (breached.length > 0) {
      console.log(`[SLA Worker] Flagged ${breached.length} newly breached tickets.`);
    }
  } catch (err) {
    console.error('[SLA Worker] Error running breach check:', err.message);
  }
}, 60 * 1000);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// SPA Fallback to public/index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` EDUGUARD 360 SERVER RUNNING ON PORT ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
