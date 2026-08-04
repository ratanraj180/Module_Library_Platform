const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const componentRoutes = require('./routes/components');
const versionRoutes = require('./routes/versions');
const reviewRoutes = require('./routes/reviews');
const aiRoutes = require('./routes/ai');
const securityRoutes = require('./routes/security');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

// CORS must come before helmet so preflight OPTIONS requests
// receive the correct Access-Control headers before helmet can interfere.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Render health checks, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(helmet());

if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());

// Main application routing mapping
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/modules', versionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/security', securityRoutes);


// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
