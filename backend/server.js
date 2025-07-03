const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();

// Improved CORS configuration for Heroku
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
const allowedOrigins = [
  frontendUrl,
  'https://cryptoken-tasks.vercel.app', // Your Vercel frontend
  'https://api.twitter.com',
  'https://discord.com',
  'https://accounts.google.com',
  'https://oauth.telegram.org',
  'http://localhost:3000', // Local Next.js dev
  'http://localhost:3001', // Local frontend
];

// Add Heroku app URL to allowed origins
if (process.env.HEROKU_APP_NAME) {
  allowedOrigins.push(`https://${process.env.HEROKU_APP_NAME}.herokuapp.com`);
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://cryptoken-tasks.vercel.app',
      'https://web3-tasks-site-aq9su0nie-anuja-geeths-projects.vercel.app', // Add this deployment URL
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Health check endpoint for Heroku
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Has token: ${req.cookies.token ? 'Yes' : 'No'}`);
  next();
});

// MongoDB connection with improved error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying MongoDB connection in 10 seconds...');
      setTimeout(connectDB, 10000);
    } else {
      process.exit(1);
    }
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/events', require('./routes/events'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/twitter', require('./routes/twitter'));
app.use('/api/telegram', require('./routes/telegram'));
app.use('/api/discord', require('./routes/discord'));
app.use('/api/google', require('./routes/google'));
app.use('/api/feedback', require('./routes/feedback'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'CRYPTOKEN Tasks API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for unhandled routes
app.use('/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Use Heroku's assigned port or fallback to 5001
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});