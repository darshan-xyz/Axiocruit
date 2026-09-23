/**
 * Socket.IO Initialization & Gateway Layer
 * Author: Procruit Realtime Engineering
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { registerChatHandlers } = require('./chatHandler');
const { registerProctorHandlers } = require('./proctorHandler');
const { registerInterviewSignalingHandlers } = require('./interviewSignaling');
const { normalizeRole } = require('../schemas/roleTaxonomy');

const createSocketServer = (httpServer, options = {}) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
      ...options.cors,
    },
    ...options,
  });

  // JWT Handshake Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
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

    // Register domain event handlers
    registerChatHandlers(io, socket, userSocketMap);
    registerProctorHandlers(io, socket, proctorThrottles);
    registerInterviewSignalingHandlers(io, socket, sharedState);
  });

  return {
    io,
    sharedState,
  };
};

module.exports = {
  createSocketServer,
};
