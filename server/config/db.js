const mongoose = require('mongoose');

let memoryServerInstance = null;
let reconnectInterval = null;
let isConnecting = false;

const startAutoReconnect = (uri) => {
  if (reconnectInterval) return;
  reconnectInterval = setInterval(async () => {
    if (mongoose.connection.readyState === 1 || isConnecting) return;
    try {
      isConnecting = true;
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`[Axiocruit Database] ✅ MongoDB connected successfully: ${conn.connection.host}`);
    } catch (e) {
      // Still offline, will retry silently
    } finally {
      isConnecting = false;
    }
  }, 5000);
  reconnectInterval.unref();
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/axiocruit';

  // 1. Attempt standard connection (Atlas or running local Mongo)
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    try {
      require('./seedDefaultData')().catch((err) => {
        console.warn('[Axiocruit Database] Seed data execution warning:', err.message);
      });
    } catch (seedReqErr) {
      console.warn('[Axiocruit Database] Seed module load warning:', seedReqErr.message);
    }
    return conn;
  } catch (error) {
    console.warn(`[Axiocruit Database] Local/remote MongoDB at ${uri} is not reachable (${error.message}).`);

    // 2. In non-production, auto-spin embedded MongoMemoryServer for development/testing
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Axiocruit Database] 🚀 Starting embedded in-memory MongoDB instance for zero-config development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({
          instance: { launchTimeout: 60000 }
        });
        const memUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Axiocruit Database] ✅ Embedded MongoDB active at ${memUri}! Full database functionality enabled.`);
        try {
          require('./seedDefaultData')().catch((err) => {
            console.warn('[Axiocruit Database] Embedded seed data execution warning:', err.message);
          });
        } catch (seedReqErr) {
          console.warn('[Axiocruit Database] Embedded seed module load warning:', seedReqErr.message);
        }
        return conn;
      } catch (memErr) {
        console.error('[Axiocruit Database] Could not start embedded MongoDB:', memErr.message);
      }
    }

    // 3. Fallback: schedule auto-reconnect in case user starts Docker/Mongo later
    startAutoReconnect(uri);
    throw error;
  }
};

const stopMemoryServer = async () => {
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
};

module.exports = connectDB;
module.exports.stopMemoryServer = stopMemoryServer;
