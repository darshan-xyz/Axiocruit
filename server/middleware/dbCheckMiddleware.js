const mongoose = require('mongoose');

/**
 * Middleware: Verify Database Connectivity
 * Returns 503 with clear diagnostics when MongoDB is not connected,
 * preventing unhandled Mongoose buffering timeouts and generic 'Server error' crashes.
 */
const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently unavailable. Please ensure MongoDB is running (e.g. via Docker: docker run -d -p 27017:27017 mongo, or configure MONGO_URI in server/.env).',
      code: 'DATABASE_OFFLINE',
      requestId: req.id,
    });
  }
  next();
};

module.exports = { requireDatabase };
