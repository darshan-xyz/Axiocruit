/**
 * Socket.IO Initialization & Gateway Layer
 * Author: Axiocruit Realtime Engineering
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const { registerChatHandlers } = require('./chatHandler');
const { registerProctorHandlers } = require('./proctorHandler');
const { registerInterviewSignalingHandlers } = require('./interviewSignaling');
const { normalizeRole } = require('../schemas/roleTaxonomy');
const { getJwtSecret } = require('../config/jwt');
const metricsCollector = require('../utils/metricsCollector');

// State tracking for Redis pub/sub clients
let redisPubClient = null;
let redisSubClient = null;
let isRedisAdapterActive = false;

/**
 * Initialize Redis Adapter for Horizontal Socket.IO Scaling
 * Gracefully falls back to default in-memory adapter on missing REDIS_URL or connection failure.
 */
const initRedisAdapter = async (io, redisUrl = process.env.REDIS_URL) => {
  if (!redisUrl) {
    console.log('[Socket.IO] Using in-memory adapter (set REDIS_URL to enable horizontal cluster scaling)');
    return { active: false, mode: 'memory' };
  }

  let pubClient = null;
  let subClient = null;

  try {
    const clientOptions = {
      url: redisUrl,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: false,
      },
    };

    pubClient = createClient(clientOptions);
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      console.warn('[Socket.IO Redis Pub Warning]', err.message);
    });
    subClient.on('error', (err) => {
      console.warn('[Socket.IO Redis Sub Warning]', err.message);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    redisPubClient = pubClient;
    redisSubClient = subClient;
    isRedisAdapterActive = true;
    console.log(`[Socket.IO] Successfully mounted Redis adapter for horizontal cluster scaling (${redisUrl})`);
    return { active: true, mode: 'redis' };
  } catch (err) {
    console.warn(`[Socket.IO Warning] Could not connect to Redis at ${redisUrl} (${err.message}). Falling back to in-memory adapter.`);
    isRedisAdapterActive = false;
    if (pubClient) {
      pubClient.disconnect().catch(() => {});
    }
    if (subClient) {
      subClient.disconnect().catch(() => {});
    }
    return { active: false, mode: 'memory', error: err.message };
  }
};

/**
 * Cleanly close active Redis adapter pub/sub connections
 */
const closeRedisAdapter = async () => {
  if (redisPubClient && redisSubClient) {
    try {
      await Promise.all([
        redisPubClient.quit().catch(() => {}),
        redisSubClient.quit().catch(() => {}),
      ]);
    } catch (_) {
      // Ignore cleanup errors during shutdown
    }
    redisPubClient = null;
    redisSubClient = null;
    isRedisAdapterActive = false;
  }
};

const createSocketServer = (httpServer, options = {}) => {
  const JWT_SECRET = getJwtSecret();

  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
      ...options.cors,
    },
    maxHttpBufferSize: 5e6, // 5MB maximum message buffer
    pingTimeout: 30000,
    pingInterval: 10000,
    ...options,
  });

  // Attempt Redis adapter attachment if REDIS_URL or options.redisUrl is provided
  const targetRedisUrl = options.redisUrl !== undefined ? options.redisUrl : process.env.REDIS_URL;
  if (targetRedisUrl) {
    initRedisAdapter(io, targetRedisUrl).catch((err) => {
      console.warn('[Socket.IO] Asynchronous Redis adapter init error:', err.message);
    });
  }

  // JWT Handshake Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      socket.userName = socket.handshake.auth?.userName || decoded.name || 'Unknown User';
      socket.userRole = normalizeRole(decoded.role);
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Stateful tracking maps
  const activeRooms = new Map(); // roomId -> Set of { socketId, userId, userName, role }
  const waitingRooms = new Map(); // roomId -> Set of { socketId, userId, userName, role }
  const proctorThrottles = new Map(); // socketId -> Map<eventType, lastTimestamp>
  const userSocketMap = new Map(); // userId -> socketId

  const sharedState = {
    activeRooms,
    waitingRooms,
    proctorThrottles,
    userSocketMap,
  };

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.userName} (${socket.userId}, ${socket.userRole})`);
    metricsCollector.incGauge('axiocruit_active_websocket_connections', { type: 'realtime' }, 1);

    socket.on('disconnect', () => {
      metricsCollector.decGauge('axiocruit_active_websocket_connections', { type: 'realtime' }, 1);
    });

    // Register domain event handlers
    registerChatHandlers(io, socket, userSocketMap);
    registerProctorHandlers(io, socket, proctorThrottles);
    registerInterviewSignalingHandlers(io, socket, sharedState);
  });

  return {
    io,
    sharedState,
    initRedisAdapter: (url) => initRedisAdapter(io, url),
    closeRedisAdapter,
    isRedisActive: () => isRedisAdapterActive,
  };
};

module.exports = {
  createSocketServer,
  initRedisAdapter,
  closeRedisAdapter,
  isRedisActive: () => isRedisAdapterActive,
};
