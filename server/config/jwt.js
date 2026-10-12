/**
 * JWT Configuration Helper
 * Centralizes JWT secret retrieval across all authentication and websocket middleware.
 */

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'secret123';
};

module.exports = {
  getJwtSecret,
};
