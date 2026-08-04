function registerChatHandlers(io, socket) {
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`[ChatModule] Socket ${socket.id} joined room ${room}`);
  });

  socket.on('send_message', (data) => {
    console.log(`[ChatModule] Message received from ${data.user} in room ${data.room}:`, data.text);
    io.to(data.room).emit('receive_message', {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      user: data.user,
      text: data.text,
      createdAt: new Date()
    });
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user_typing', { user: data.user, isTyping: data.isTyping });
  });
}

module.exports = {
  registerChatHandlers
};
