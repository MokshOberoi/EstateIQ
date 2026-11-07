const express = require('express');
const path = require('path');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ============================================================================
// GLOBAL MIDDLEWARES
// ============================================================================

// Configure CORS for local frontend integration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/v1', healthRoutes);
app.use('/api/v1', require('./routes/propertyRoutes'));
app.use('/api/v1', require('./routes/propertyImageRoutes'));
// Serve uploaded property images statically
app.use('/uploads/properties', express.static(path.join(__dirname, '../uploads/properties')));
app.use('/api/v1', require('./routes/leadRoutes'));
app.use('/api/v1', require('./routes/recommendationRoutes'));
app.use('/api/v1/auth', authRoutes);

// Root route welcome banner
app.get('/', (req, res) => {
  res.json({
    name: 'EstateIQ API',
    version: '1.0.0',
    description: 'AI-Powered Real Estate Lead Intelligence & Recommendation Platform',
    documentation: '/api/v1/health',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Catch unmapped routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

