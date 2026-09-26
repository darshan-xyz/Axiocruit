/**
 * HTTP & Socket.IO Server Bootstrap & Lifecycle Orchestrator
 * Author: Axiocruit Core Engineering
 */

const http = require('http');
const connectDB = require('../config/db');
const { createApp } = require('./app');
const { createSocketServer } = require('../realtime/socketServer');

const startServer = () => {
  const app = createApp();
  const PORT = process.env.PORT || 5000;

  // Create unified HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  const { io, sharedState } = createSocketServer(server);

  // Connect to DB first, then listen
  connectDB()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`[Axiocruit Server] Running on port ${PORT} (HTTP + Socket.IO)`);
      });
    })
    .catch((err) => {
      console.warn(`[Axiocruit Backend Warning] Could not connect to MongoDB (${err.message}). Starting server in offline/degraded mode.`);
      console.warn(`[Axiocruit Backend Info] Set a valid MONGO_URI in server/.env to enable database operations.`);
      server.listen(PORT, () => {
        console.log(`[Axiocruit Server] Running on port ${PORT} (HTTP + Socket.IO) [MongoDB Offline]`);
      });
    });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n[Axiocruit Server] Received ${signal}. Starting graceful shutdown...`);

    if (io) {
      io.close(() => {
        console.log('[Axiocruit Server] Socket.IO server closed.');
      });
    }

    server.close(async () => {
      console.log('[Axiocruit Server] HTTP server closed.');
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('[Axiocruit Server] MongoDB connection closed.');
        }
        const { stopMemoryServer } = require('../config/db');
        await stopMemoryServer();
      } catch (err) {
        console.error('[Axiocruit Server] Error closing MongoDB connection:', err.message);
      }

      console.log('[Axiocruit Server] Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Axiocruit Server] Forcefully shutting down after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Axiocruit Server Alert] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Axiocruit Server Fatal] Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  return { app, server, io, sharedState };
};

module.exports = {
  startServer,
};
