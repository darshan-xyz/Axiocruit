/**
 * Enterprise Authentication Guard for Axiocruit
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole } = require('../schemas/roleTaxonomy');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found or account deactivated' });
      }
      return next();
    } catch (error) {
      console.error('[AuthGuard] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore errors for optional auth
    }
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
};
