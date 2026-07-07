const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // For demo / local workspace flexibility
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json({ limit: '10mb' })); // Support larger base64 screenshots
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable strict CSP to allow loading external CDNs and running inline React JSX in the browser
    crossOriginResourcePolicy: false, // Allows browser to render uploaded screenshots
  })
);

// Enable CORS
app.use(cors());

// Expose Static Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiter to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // maximum requests per IP
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Stricter rate limiting on authentication routes (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // maximum 50 requests per 15 minutes per IP for login/register
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

// Fallback to React SPA index.html
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Socket.io WebSockets Logic for Admin Live Monitoring
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Student joins exam room
  socket.on('join-exam', ({ sessionId, studentName, testTitle }) => {
    socket.join(`exam_${sessionId}`);
    console.log(`Student ${studentName} joined exam: ${testTitle} (Session: ${sessionId})`);
    
    // Notify admins in the lobby room
    io.to('admin_lobby').emit('student-entered', {
      socketId: socket.id,
      sessionId,
      studentName,
      testTitle,
      timestamp: new Date(),
    });
  });

  // Admin joins lobby
  socket.on('join-admin-lobby', () => {
    socket.join('admin_lobby');
    console.log(`Admin joined monitoring lobby: ${socket.id}`);
  });

  // Student sends continuous progress updates (heartbeat)
  socket.on('exam-heartbeat', ({ sessionId, studentName, currentQuestionIndex, timeLeft, warningCount, status }) => {
    // Forward to administrative dashboard
    io.to('admin_lobby').emit('proctor-update', {
      sessionId,
      studentName,
      currentQuestionIndex,
      timeLeft,
      warningCount,
      status: status || 'in-progress',
      timestamp: new Date(),
    });
  });

  // Student reports a violation event
  socket.on('student-violation', ({ sessionId, studentName, testTitle, violationType, warningCount, screenshotUrl }) => {
    console.log(`[VIOLATION] Student ${studentName} in ${testTitle} triggered ${violationType} (Warning #${warningCount})`);
    
    // Broadcast warning immediately to admin monitors
    io.to('admin_lobby').emit('proctor-alert', {
      sessionId,
      studentName,
      testTitle,
      violationType,
      warningCount,
      screenshotUrl,
      timestamp: new Date(),
    });
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    io.to('admin_lobby').emit('student-disconnected', { socketId: socket.id });
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
