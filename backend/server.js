const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS setup with more permissive options for development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'] // Make sure Set-Cookie is exposed
}));

// Debugging middleware to log request details
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Default route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Catch-all for unhandled routes
app.use('/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Try multiple ports if the default one is in use
const server = http.createServer(app);

// Define ports to try (original port and some alternatives)
const PORT = parseInt(process.env.PORT || '5001');
const ALTERNATIVE_PORTS = [5000, 5002, 5003, 5004, 5005];

// Function to try starting the server on different ports
function tryPort(port) {
  server.listen(port);
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying another port...`);
      
      // Try the next port if available
      if (ALTERNATIVE_PORTS.length > 0) {
        const nextPort = ALTERNATIVE_PORTS.shift();
        tryPort(nextPort);
      } else {
        console.error('All ports are in use. Please close some applications and try again.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
  
  server.on('listening', () => {
    const addr = server.address();
    console.log(`Server running on port ${addr.port}`);
    
    // If we're using an alternative port, update the environment variable
    if (port !== PORT) {
      console.log(`Note: Using alternative port ${port} instead of configured port ${PORT}`);
      console.log(`Update your frontend's BACKEND_URL to use this port.`);
    }
  });
}

// Start trying ports
tryPort(PORT);