/**
 * Realtime Direct Messaging & Room Chat Handler
 * Author: Procruit Realtime Engineering
 */

const registerChatHandlers = (io, socket, userSocketMap) => {
  // Register user for direct message routing
  socket.on('register-user', (userId) => {
    if (userId) {
      userSocketMap.set(String(userId), socket.id);
      console.log(`[Socket.IO][DM] Registered user ${userId} -> ${socket.id}`);
    }
  });

  // Relay direct message to recipient
  socket.on('send-message', (data) => {
    if (!data || !data.receiverId) return;
    const recipientSocketId = userSocketMap.get(String(data.receiverId));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', data.message);
      console.log(`[Socket.IO][DM] Relayed message from ${socket.userId} to ${data.receiverId}`);
    }
  });

  // Room chat messaging
  socket.on('chat-message', (data) => {
    const roomId = data?.roomId || socket.currentRoom;
    if (roomId) {
      socket.to(roomId).emit('chat-message', {
        ...data,
        senderId: socket.userId,
        senderName: socket.userName,
        timestamp: new Date().toISOString(),
      });
    }
  });
};

module.exports = {
  registerChatHandlers,
};
