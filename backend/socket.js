const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

const connectedUsers = new Map();

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      // Update user status to online
      await User.findByIdAndUpdate(socket.userId, { online: true });
      connectedUsers.set(socket.userId, socket.id);

      // Broadcast user online status
      socket.broadcast.emit('user:online', { userId: socket.userId });

      // Handle private messages
      socket.on('message:send', async (data) => {
        try {
          const { messageId, senderId, receiverId, content, type, fileUrl } = data;
          
          // Find the socket ID of the receiver
          const receiverSocketId = connectedUsers.get(receiverId);
          
          if (receiverSocketId) {
            // Emit the message to the receiver
            io.to(receiverSocketId).emit('message:receive', {
              messageId,
              senderId,
              content,
              type,
              fileUrl,
              status: 'delivered'
            });

            // Update message status to delivered
            await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
            
            // Notify sender that message was delivered
            io.to(socket.id).emit('message:status', {
              messageId,
              status: 'delivered'
            });
          }
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      // Handle message read status
      socket.on('message:read', async (data) => {
        try {
          const message = await Message.findByIdAndUpdate(
            data.messageId,
            { status: 'read' },
            { new: true }
          );

          if (message) {
            const senderSocketId = connectedUsers.get(message.sender.toString());
            if (senderSocketId) {
              io.to(senderSocketId).emit('message:status', {
                messageId: data.messageId,
                status: 'read'
              });
            }
          }
        } catch (error) {
          console.error('Error updating message read status:', error);
        }
      });

      // Handle typing status
      socket.on('typing:start', (data) => {
        const receiverSocketId = connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('typing:start', { userId: socket.userId });
        }
      });

      socket.on('typing:stop', (data) => {
        const receiverSocketId = connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('typing:stop', { userId: socket.userId });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await User.findByIdAndUpdate(socket.userId, { online: false });
        connectedUsers.delete(socket.userId);
        socket.broadcast.emit('user:offline', { userId: socket.userId });
      });
    } catch (error) {
      console.error('Socket error:', error);
    }
  });
};

module.exports = { socketHandler };
