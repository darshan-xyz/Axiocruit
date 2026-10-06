/**
 * Realtime Proctoring Telemetry Handler
 * Author: Axiocruit Proctoring Engineering
 */

const PROCTOR_THROTTLE_MS = 3000;

const registerProctorHandlers = (io, socket, proctorThrottles) => {
  // Relay candidate proctor events to recruiters/interviewers
  socket.on('proctor-event', (eventData) => {
    if (!eventData || typeof eventData !== 'object') {
      return;
    }

    const interviewId = eventData.roomId || eventData.meetingId || eventData.interviewId || socket.currentRoom;
    if (!interviewId) {
      return;
    }

    // Rate-limit per socket per event type
    const evType = eventData.type || 'unknown';
    if (!proctorThrottles.has(socket.id)) {
      proctorThrottles.set(socket.id, new Map());
    }
    const socketThrottles = proctorThrottles.get(socket.id);
    const lastEmit = socketThrottles.get(evType) || 0;
    const now = Date.now();

    if (now - lastEmit < PROCTOR_THROTTLE_MS) {
      return;
    }
    socketThrottles.set(evType, now);

    console.log(`[Socket.IO][Proctor] Relaying ${evType} from ${socket.userName} to room ${interviewId}`);
    socket.to(interviewId).emit('proctor-event', {
      ...eventData,
      candidateName: socket.userName,
      candidateId: socket.userId,
    });
  });

  socket.on('proctor-status-toggle', (data) => {
    if (!data) return;
    const interviewId = data?.roomId || data?.meetingId || data?.interviewId || socket.currentRoom;
    if (interviewId) {
      socket.to(interviewId).emit('proctor-status-updated', data);
    }
  });
};

module.exports = {
  registerProctorHandlers,
  PROCTOR_THROTTLE_MS,
};
