/**
 * Realtime Direct Messaging & Room Chat Handler
 * Author: Axiocruit Realtime Engineering
 */

const registerChatHandlers = (io, socket, userSocketMap) => {
  // Register user for direct message routing — bind strictly to authenticated socket.userId
  socket.on('register-user', (userId) => {
    const boundUserId = socket.userId || userId;
    if (boundUserId) {
      userSocketMap.set(String(boundUserId), socket.id);
      console.log(`[Socket.IO][DM] Registered user ${boundUserId} -> ${socket.id}`);
    }
  });

  // Join a dedicated chat room
  socket.on('join-chat', (chatId) => {
    if (chatId) {
      socket.join(`chat:${chatId}`);
      console.log(`[Socket.IO][DM] User ${socket.userId} joined chat:${chatId}`);
    }
  });

  // Relay direct message to recipient
  socket.on('send-message', (data) => {
    if (!data || !data.receiverId) return;
    const recipientSocketId = userSocketMap.get(String(data.receiverId));
    if (recipientSocketId) {
      const payload = typeof data.message === 'object'
        ? { ...data.message, senderId: socket.userId, senderName: socket.userName }
        : { content: data.message, senderId: socket.userId, senderName: socket.userName };
      io.to(recipientSocketId).emit('receive-message', payload);
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
