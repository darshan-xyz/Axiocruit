/**
 * HTTP & Socket.IO Server Bootstrap & Lifecycle Orchestrator
 * Author: Procruit Core Engineering
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
        console.log(`[Procruit Server] Running on port ${PORT} (HTTP + Socket.IO)`);
      });
    })
    .catch((err) => {
      console.warn(`[Procruit Backend Warning] Could not connect to MongoDB (${err.message}). Starting server in offline/degraded mode.`);
      console.warn(`[Procruit Backend Info] Set a valid MONGO_URI in server/.env to enable database operations.`);
      server.listen(PORT, () => {
        console.log(`[Procruit Server] Running on port ${PORT} (HTTP + Socket.IO) [MongoDB Offline]`);
      });
    });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n[Procruit Server] Received ${signal}. Starting graceful shutdown...`);

    if (io) {
      io.close(() => {
        console.log('[Procruit Server] Socket.IO server closed.');
      });
    }

    server.close(async () => {
      console.log('[Procruit Server] HTTP server closed.');
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('[Procruit Server] MongoDB connection closed.');
        }
        const { stopMemoryServer } = require('../config/db');
        await stopMemoryServer();
      } catch (err) {
        console.error('[Procruit Server] Error closing MongoDB connection:', err.message);
      }

      console.log('[Procruit Server] Graceful shutdown complete. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Procruit Server] Forcefully shutting down after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Procruit Server Alert] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Procruit Server Fatal] Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  return { app, server, io, sharedState };
};

module.exports = {
  startServer,
};
