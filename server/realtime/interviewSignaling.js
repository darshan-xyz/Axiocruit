/**
 * Realtime WebRTC Interview Signaling & Collaborative Session Handler
 * Author: Axiocruit Realtime Engineering
 */

const Interview = require('../models/Interview');
const { isHostRole, CanonicalRoles } = require('../schemas/roleTaxonomy');

const registerInterviewSignalingHandlers = (io, socket, state) => {
  const { activeRooms, waitingRooms, userSocketMap, proctorThrottles } = state;

  // --- Join Interview Room ---
  socket.on('join-room', async (payload) => {
    const interviewId = typeof payload === 'string' ? payload : (payload?.roomId || payload?.interviewId);
    if (!interviewId) return;

    const joiningUserId = socket.userId;

    if (typeof payload === 'object') {
      if (payload.userName) socket.userName = payload.userName;
      // Note: socket.userRole is cryptographically assigned via JWT handshake.
      // We do NOT allow client-supplied payload.role to override authenticated role.
    }

    let interview = null;
    try {
      interview = await Interview.findOne({
        $or: [
          ...(interviewId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: interviewId }] : []),
          { meetingId: interviewId },
        ],
      });

      if (interview) {
        const isRecruiter = interview.recruiterId && joiningUserId === interview.recruiterId.toString();
        const isInterviewer = interview.interviewerId && joiningUserId === interview.interviewerId.toString();
        const isCandidate = interview.candidateId && joiningUserId === interview.candidateId.toString();

        if (isRecruiter) {
          socket.userRole = CanonicalRoles.RECRUITER;
        } else if (isInterviewer) {
          socket.userRole = CanonicalRoles.INTERVIEWER;
        } else if (isCandidate) {
          socket.userRole = CanonicalRoles.CANDIDATE;
        }
      }
    } catch (err) {
      console.error('[Socket.IO] Error fetching interview info:', err.message);
    }

    socket.currentRoom = interviewId;

    if (!activeRooms.has(interviewId)) {
      activeRooms.set(interviewId, new Set());
    }
    if (!waitingRooms.has(interviewId)) {
      waitingRooms.set(interviewId, new Set());
    }

    const isRecruiter = isHostRole(socket.userRole);
    const hostPresent = Array.from(activeRooms.get(interviewId)).some((u) => isHostRole(u.role));
    const isCodingRoom = payload?.roomType === 'coding' || payload?.roomType === 'assessment' || payload?.isAssessment || payload?.isCodingTest || !interview;

    if (isRecruiter || isCodingRoom) {
      socket.join(interviewId);
      activeRooms.get(interviewId).add({
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole,
      });

      socket.to(interviewId).emit('user-connected', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
      });

      const roomUsers = [];
      activeRooms.get(interviewId).forEach((user) => {
        if (user.socketId !== socket.id) {
          roomUsers.push(user);
        }
      });
      socket.emit('room-users', roomUsers);

      const waiting = Array.from(waitingRooms.get(interviewId));
      waiting.forEach((user) => {
        socket.emit('admission-request', user);
      });

      console.log(`[Socket.IO] User ${socket.userName} (${socket.userRole}) joined room: ${interviewId}`);
    } else {
      if (!hostPresent) {
        waitingRooms.get(interviewId).add({
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
        });
        socket.emit('waiting-for-host');
        console.log(`[Socket.IO] Candidate ${socket.userName} waiting for host in room: ${interviewId}`);
      } else {
        waitingRooms.get(interviewId).add({
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          role: socket.userRole,
        });
        socket.emit('waiting-for-host');

        io.to(interviewId).emit('admission-request', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
        });
        console.log(`[Socket.IO] Candidate ${socket.userName} requesting admission to room: ${interviewId}`);
      }
    }
  });

  // --- Admit User ---
  socket.on('admit-user', ({ targetSocketId }) => {
    if (!isHostRole(socket.userRole)) {
      return socket.emit('error', 'Unauthorized: Only meeting host can admit users');
    }

    const interviewId = socket.currentRoom;
    if (!interviewId || !waitingRooms.has(interviewId)) return;

    const waitingSet = waitingRooms.get(interviewId);
    let targetUser = null;
    for (const u of waitingSet) {
      if (u.socketId === targetSocketId) {
        targetUser = u;
        break;
      }
    }

    if (targetUser) {
      waitingSet.delete(targetUser);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.currentRoom = interviewId;
        targetSocket.join(interviewId);
        activeRooms.get(interviewId).add(targetUser);
        targetSocket.emit('admitted');

        targetSocket.to(interviewId).emit('user-connected', {
          socketId: targetUser.socketId,
          userId: targetUser.userId,
          userName: targetUser.userName,
        });

        const roomUsers = [];
        activeRooms.get(interviewId).forEach((user) => {
          if (user.socketId !== targetSocketId) {
            roomUsers.push(user);
          }
        });
        targetSocket.emit('room-users', roomUsers);
        console.log(`[Socket.IO] ${socket.userName} admitted ${targetUser.userName} to room: ${interviewId}`);
      }
    }
  });

  // --- Deny User ---
  socket.on('deny-user', ({ targetSocketId }) => {
    if (!isHostRole(socket.userRole)) {
      return socket.emit('error', 'Unauthorized: Only meeting host can deny users');
    }

    const interviewId = socket.currentRoom;
    if (!interviewId || !waitingRooms.has(interviewId)) return;

    const waitingSet = waitingRooms.get(interviewId);
    for (const u of waitingSet) {
      if (u.socketId === targetSocketId) {
        waitingSet.delete(u);
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.emit('admission-denied');
        }
        console.log(`[Socket.IO] ${socket.userName} denied admission for socket: ${targetSocketId}`);
        break;
      }
    }
  });

  // --- WebRTC Signaling ---
  socket.on('offer', (data) => {
    if (!data?.to || !data?.offer) return;
    socket.to(data.to).emit('offer', {
      offer: data.offer,
      from: socket.id,
      userId: socket.userId,
      userName: socket.userName,
    });
  });

  socket.on('answer', (data) => {
    if (!data?.to || !data?.answer) return;
    socket.to(data.to).emit('answer', {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on('ice-candidate', (data) => {
    if (!data?.to || !data?.candidate) return;
    socket.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  // --- Code Editor Sync ---
  socket.on('code-change', ({ roomId, code, language }) => {
    const targetRoom = roomId || socket.currentRoom;
    if (targetRoom) {
      socket.to(targetRoom).emit('code-change', {
        code,
        language,
        from: socket.userId,
      });
    }
  });

  socket.on('language-change', ({ roomId, language }) => {
    const targetRoom = roomId || socket.currentRoom;
    if (targetRoom) {
      socket.to(targetRoom).emit('language-change', { language, from: socket.userId });
    }
  });

  socket.on('request-editor-state', ({ roomId }) => {
    const targetRoom = roomId || socket.currentRoom;
    if (targetRoom) {
      socket.to(targetRoom).emit('provide-editor-state', { requesterId: socket.id });
    }
  });

  socket.on('editor-state-response', ({ targetSocketId, code, language }) => {
    io.to(targetSocketId).emit('editor-state-sync', { code, language });
  });

  // --- Whiteboard Sync ---
  socket.on('whiteboard-update', (data) => {
    const interviewId = data?.roomId || data?.meetingId || socket.currentRoom;
    if (interviewId) {
      socket.to(interviewId).emit('whiteboard-update', {
        elements: data?.elements || [],
        from: socket.userId,
      });
    }
  });

  // --- Kick Participant (Strict Host Verification) ---
  socket.on('kick-user', ({ targetSocketId }) => {
    if (!targetSocketId) return;

    if (!isHostRole(socket.userRole)) {
      console.warn(`[Socket.IO] Unauthorized kick-user attempt by ${socket.userName} (${socket.userRole})`);
      return socket.emit('error', 'Unauthorized: Only meeting host can kick participants');
    }

    io.to(targetSocketId).emit('kicked-from-room');
    console.log(`[Socket.IO] ${socket.userName} kicked socket: ${targetSocketId} from room: ${socket.currentRoom}`);
  });

  // --- Adaptive Test Sync ---
  socket.on('adaptive-test-event', (data) => {
    const interviewId = (typeof data === 'object' && (data?.sessionId || data?.meetingId || data?.roomId || data?.interviewId)) || socket.currentRoom;
    if (!interviewId) return;
    socket.to(interviewId).emit('adaptive-test-sync', data);
  });

  // --- End Interview (Strict Host Verification & Waiting Room Eviction) ---
  socket.on('end-interview', ({ meetingId }) => {
    const interviewId = meetingId || socket.currentRoom;
    if (!interviewId) return;

    if (!isHostRole(socket.userRole)) {
      console.warn(`[Socket.IO] Unauthorized end-interview attempt by ${socket.userName} (${socket.userRole})`);
      return socket.emit('error', 'Unauthorized: Only meeting host can end the interview');
    }

    console.log(`[Socket.IO] 🏁 ${socket.userName} triggered end-interview for room: ${interviewId}`);
    
    // Notify active room participants
    io.in(interviewId).emit('interview-ended', {
      message: 'This interview has been completed by the host.',
      endedBy: socket.userName,
    });

    // Notify waiting room candidates so they are not stranded
    const wUsers = waitingRooms.get(interviewId);
    if (wUsers) {
      wUsers.forEach((user) => {
        io.to(user.socketId).emit('interview-ended', {
          message: 'This interview has been completed by the host.',
          endedBy: socket.userName,
        });
      });
      waitingRooms.delete(interviewId);
    }

    // Clean up active room sockets
    const roomUsers = activeRooms.get(interviewId);
    if (roomUsers) {
      roomUsers.forEach((user) => {
        const userSocket = io.sockets.sockets.get(user.socketId);
        if (userSocket) {
          userSocket.leave(interviewId);
        }
      });
      activeRooms.delete(interviewId);
    }
  });

  // --- Coding Test Started Event ---
  socket.on('coding-test-started-event', (data) => {
    const interviewId = (typeof data === 'string' ? data : (data?.roomId || data?.meetingId || data?.interviewId || data?.sessionId)) || socket.currentRoom;
    if (!interviewId) return;
    socket.to(interviewId).emit('coding-test-started');
  });

  // --- Disconnect Handler ---
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.userName} (${socket.userId})`);

    if (socket.currentRoom) {
      const roomUsers = activeRooms.get(socket.currentRoom);
      if (roomUsers) {
        roomUsers.forEach((user) => {
          if (user.socketId === socket.id) {
            roomUsers.delete(user);
          }
        });
        if (roomUsers.size === 0) {
          activeRooms.delete(socket.currentRoom);
        }
      }

      const wUsers = waitingRooms.get(socket.currentRoom);
      if (wUsers) {
        wUsers.forEach((user) => {
          if (user.socketId === socket.id) {
            wUsers.delete(user);
            io.to(socket.currentRoom).emit('admission-canceled', { socketId: socket.id });
          }
        });
        if (wUsers.size === 0) {
          waitingRooms.delete(socket.currentRoom);
        }
      }

      socket.to(socket.currentRoom).emit('user-disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
      });
    }

    proctorThrottles.delete(socket.id);

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });
};

module.exports = {
  registerInterviewSignalingHandlers,
};
