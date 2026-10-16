/**
 * Axiocruit Enterprise 300-Day Production Master Plan
 * Stage 6: Socket.IO Concurrency & Memory Footprint Telemetry Framework
 *
 * Simulates 50 concurrent client connections across 10 rooms,
 * bursts real-time messaging/signaling traffic, and profiles
 * memory consumption (RSS, HeapTotal, HeapUsed, External).
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { io as Client } from 'socket.io-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(path.resolve(rootDir, 'server/index.js'));

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createSocketServer, closeRedisAdapter } = require('./realtime/socketServer');
const { getJwtSecret } = require('./config/jwt');

console.log('========================================================================');
console.log('  STAGE 6: SOCKET.IO CONCURRENCY & MEMORY FOOTPRINT TELEMETRY');
console.log('========================================================================\n');

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getMemorySnapshot() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
  };
}

async function runLoadAndStressTelemetry() {
  // Start in-memory MongoDB for realtime room participant queries
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('[Setup] In-memory MongoDB connected for realtime signaling queries.');

  const JWT_SECRET = getJwtSecret();
  const baselineMem = getMemorySnapshot();
  console.log(`[Telemetry] Baseline Memory Footprint:`);
  console.log(`  • RSS        : ${formatBytes(baselineMem.rss)}`);
  console.log(`  • Heap Total : ${formatBytes(baselineMem.heapTotal)}`);
  console.log(`  • Heap Used  : ${formatBytes(baselineMem.heapUsed)}`);
  console.log(`  • External   : ${formatBytes(baselineMem.external)}\n`);

  // 1. Create HTTP Server and bind Socket.IO
  const server = http.createServer();
  const socketApp = createSocketServer(server);
  const io = socketApp.io;

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const serverUrl = `http://127.0.0.1:${port}`;
  console.log(`[Socket.IO Server] Listening on ephemeral port ${port}`);

  const NUM_CLIENTS = 50;
  const NUM_ROOMS = 10;
  const CLIENTS_PER_ROOM = NUM_CLIENTS / NUM_ROOMS;

  console.log(`[Load Test Plan] Launching ${NUM_CLIENTS} concurrent clients into ${NUM_ROOMS} rooms (${CLIENTS_PER_ROOM} clients/room)...\n`);

  const clients = [];
  const connectLatencies = [];

  // 2. Establish 50 Concurrent Socket Connections with JWT Auth
  const connectStart = Date.now();
  const connectPromises = [];

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const role = i % 3 === 0 ? 'CANDIDATE' : i % 3 === 1 ? 'INTERVIEWER' : 'RECRUITER';
    const userId = `user_${i}_${role.toLowerCase()}`;
    const token = jwt.sign(
      { id: userId, _id: userId, role, name: `User ${i}` },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const roomId = `room_telemetry_${Math.floor(i / CLIENTS_PER_ROOM)}`;
    const clientConnectStart = Date.now();

    const p = new Promise((resolve, reject) => {
      const socket = Client(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      socket.on('connect', () => {
        const latency = Date.now() - clientConnectStart;
        connectLatencies.push(latency);
        socket.emit('join-room', { roomId, roomType: 'coding', userName: `User ${i}` });
        resolve({ socket, index: i, userId, roomId });
      });

      socket.on('connect_error', (err) => {
        reject(new Error(`Client ${i} connect error: ${err.message}`));
      });
    });

    connectPromises.push(p);
  }

  const connectedClients = await Promise.all(connectPromises);
  const totalConnectTime = Date.now() - connectStart;
  clients.push(...connectedClients);

  connectLatencies.sort((a, b) => a - b);
  const minLatency = connectLatencies[0];
  const maxLatency = connectLatencies[connectLatencies.length - 1];
  const p50Latency = connectLatencies[Math.floor(connectLatencies.length * 0.5)];
  const p95Latency = connectLatencies[Math.floor(connectLatencies.length * 0.95)];

  console.log(`✔ All ${NUM_CLIENTS} sockets connected & authenticated concurrently.`);
  console.log(`  • Total Handshake Time : ${totalConnectTime}ms`);
  console.log(`  • Connection Latencies : min=${minLatency}ms | p50=${p50Latency}ms | p95=${p95Latency}ms | max=${maxLatency}ms\n`);

  // 3. Peak Memory Snapshot After 50 Active Concurrent Connections
  const peakConnMem = getMemorySnapshot();
  console.log(`[Telemetry] Memory Footprint with ${NUM_CLIENTS} Active Sockets:`);
  console.log(`  • RSS        : ${formatBytes(peakConnMem.rss)} (Δ ${formatBytes(peakConnMem.rss - baselineMem.rss)})`);
  console.log(`  • Heap Used  : ${formatBytes(peakConnMem.heapUsed)} (Δ ${formatBytes(peakConnMem.heapUsed - baselineMem.heapUsed)})\n`);

  // 4. Burst Real-Time Messaging & Telemetry Under Load
  console.log(`[Load Test Plan] Dispatching burst of real-time messages across ${NUM_ROOMS} rooms...`);

  let totalBroadcastsSent = 0;
  let totalBroadcastsReceived = 0;

  // Setup message listeners on all clients
  clients.forEach(({ socket }) => {
    socket.on('chat-message', () => {
      totalBroadcastsReceived++;
    });

    socket.on('code-change', () => {
      totalBroadcastsReceived++;
    });

    socket.on('language-change', () => {
      totalBroadcastsReceived++;
    });
  });

  // Small delay to ensure all join-room room subscriptions completed
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Burst messages: each room has sender emit messages
  const burstStart = Date.now();
  const MESSAGES_PER_ROOM = 10;

  for (let r = 0; r < NUM_ROOMS; r++) {
    const roomId = `room_telemetry_${r}`;
    const roomClients = clients.filter((c) => c.roomId === roomId);
    const sender = roomClients[0];

    for (let m = 0; m < MESSAGES_PER_ROOM; m++) {
      sender.socket.emit('chat-message', {
        roomId,
        text: `High-frequency telemetry payload #${m} in ${roomId}`,
      });
      totalBroadcastsSent++;

      sender.socket.emit('code-change', {
        roomId,
        code: `def solution():\n    return ${m} * 42\n`,
        language: 'python',
      });
      totalBroadcastsSent++;

      sender.socket.emit('language-change', {
        roomId,
        language: m % 2 === 0 ? 'typescript' : 'python',
      });
      totalBroadcastsSent++;
    }
  }

  // Wait for propagation of burst messages
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const burstDuration = Date.now() - burstStart;
  const msgsPerSec = ((totalBroadcastsReceived / (burstDuration / 1000))).toFixed(0);

  console.log(`✔ Message burst completed in ${burstDuration}ms.`);
  console.log(`  • Broadcasts Sent     : ${totalBroadcastsSent}`);
  console.log(`  • Broadcasts Received : ${totalBroadcastsReceived}`);
  console.log(`  • Throughput Rate     : ${msgsPerSec} events/sec\n`);

  // 5. Peak Burst Memory Snapshot
  const peakBurstMem = getMemorySnapshot();
  console.log(`[Telemetry] Memory Footprint at Peak Traffic Burst:`);
  console.log(`  • RSS        : ${formatBytes(peakBurstMem.rss)}`);
  console.log(`  • Heap Used  : ${formatBytes(peakBurstMem.heapUsed)}`);
  console.log(`  • Net Heap Growth : ${formatBytes(peakBurstMem.heapUsed - baselineMem.heapUsed)}\n`);

  // 6. Graceful Disconnection & Cleanup
  console.log(`[Teardown] Disconnecting all ${NUM_CLIENTS} sockets and tearing down server...`);
  clients.forEach(({ socket }) => {
    socket.disconnect();
  });

  await new Promise((resolve) => setTimeout(resolve, 300));
  io.close();
  await new Promise((resolve) => server.close(resolve));
  await closeRedisAdapter();
  await mongoose.disconnect();
  await mongoServer.stop();

  if (global.gc) {
    global.gc();
  }

  const finalMem = getMemorySnapshot();
  const netHeapDelta = finalMem.heapUsed - baselineMem.heapUsed;
  console.log(`[Telemetry] Post-Teardown Memory Footprint:`);
  console.log(`  • RSS        : ${formatBytes(finalMem.rss)}`);
  console.log(`  • Heap Used  : ${formatBytes(finalMem.heapUsed)}`);
  console.log(`  • Net Heap Δ : ${formatBytes(netHeapDelta)}\n`);

  // 7. Empirical Invariants Verification
  const errors = [];
  if (clients.length !== NUM_CLIENTS) {
    errors.push(`Expected ${NUM_CLIENTS} connected clients, got ${clients.length}`);
  }
  if (totalBroadcastsReceived === 0) {
    errors.push('Expected positive number of received broadcasts');
  }
  // Max allowable net heap leak after 50 sockets and message burst is 50MB
  if (netHeapDelta > 50 * 1024 * 1024) {
    errors.push(`Heap growth exceeded 50MB threshold: ${formatBytes(netHeapDelta)}`);
  }

  console.log('========================================================================');
  console.log('STAGE 6: LOAD & STRESS TELEMETRY SUMMARY');
  console.log('========================================================================');
  console.log(`Concurrent Sockets Tested  : ${NUM_CLIENTS} / ${NUM_CLIENTS} (100% SUCCESS)`);
  console.log(`Rooms Active               : ${NUM_ROOMS}`);
  console.log(`Handshake Latency p50 / p95: ${p50Latency}ms / ${p95Latency}ms`);
  console.log(`Event Propagation Rate     : ${msgsPerSec} msgs/sec`);
  console.log(`Peak Heap Used             : ${formatBytes(peakBurstMem.heapUsed)}`);
  console.log(`Net Heap Delta             : ${formatBytes(netHeapDelta)} (< 50MB SLA limit)`);
  console.log('------------------------------------------------------------------------');

  if (errors.length > 0) {
    console.error('❌ STAGE 6 FAILED:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('✅ STAGE 6 PASSED: ALL SOCKET.IO CONCURRENCY & MEMORY INVARIANTS SATISFIED.\n');
    process.exit(0);
  }
}

runLoadAndStressTelemetry().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
