import { Message, Notification } from '../models/index.js';
import User from '../models/User.js';
import { verifyAccessToken } from '../utils/authHelpers.js';

const onlineUsers = new Map(); // userId -> socketId

export const setupSockets = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.id;
        socket.user = await User.findById(decoded.id).select('firstName lastName username avatar displayName');
      }
    } catch (_) { /* anonymous user */ }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}${socket.userId ? ` (user: ${socket.userId})` : ''}`);

    // User comes online
    if (socket.userId) {
      onlineUsers.set(socket.userId.toString(), socket.id);
      socket.join(`user_${socket.userId}`);
      User.findByIdAndUpdate(socket.userId, { onlineStatus: 'online', lastActiveAt: new Date() }).exec();
      io.emit('user_online', { userId: socket.userId });
    }

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conv_${conversationId}`);
    });

    // Send message via socket
    socket.on('send_message', async ({ recipientId, content }) => {
      if (!socket.userId || !content?.trim()) return;
      try {
        const [id1, id2] = [socket.userId.toString(), recipientId].sort();
        const conversationId = `${id1}_${id2}`;

        const message = await Message.create({
          sender: socket.userId,
          recipient: recipientId,
          conversationId,
          content: content.trim(),
        });
        await message.populate('sender', 'firstName lastName username avatar');

        // Emit to both users
        io.to(`user_${recipientId}`).emit('message_received', { message });
        socket.emit('message_sent', { message });

        // Send notification if recipient is offline
        if (!onlineUsers.has(recipientId)) {
          await Notification.create({
            recipient: recipientId,
            type: 'message',
            sender: socket.userId,
            message: `${socket.user?.displayName || 'Someone'} sent you a message`,
            link: `/messages/${socket.userId}`,
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', ({ recipientId }) => {
      io.to(`user_${recipientId}`).emit('typing', { userId: socket.userId, isTyping: true });
    });

    socket.on('typing_stop', ({ recipientId }) => {
      io.to(`user_${recipientId}`).emit('typing', { userId: socket.userId, isTyping: false });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId }) => {
      if (!socket.userId) return;
      await Message.updateMany(
        { conversationId, recipient: socket.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      const otherId = conversationId.split('_').find(id => id !== socket.userId.toString());
      io.to(`user_${otherId}`).emit('messages_read', { conversationId, readBy: socket.userId });
    });

    // DND status
    socket.on('set_status', async ({ status }) => {
      if (!socket.userId) return;
      await User.findByIdAndUpdate(socket.userId, { onlineStatus: status });
      io.emit('user_status_change', { userId: socket.userId, status });
    });

    // Join community channel
    socket.on('join_channel', ({ channelId }) => {
      socket.join(`channel_${channelId}`);
    });

    // Channel message
    socket.on('channel_message', async ({ channelId, content }) => {
      if (!socket.userId || !content?.trim()) return;
      try {
        const message = await Message.create({
          sender: socket.userId,
          channel: channelId,
          content: content.trim(),
        });
        await message.populate('sender', 'firstName lastName username avatar');
        io.to(`channel_${channelId}`).emit('channel_message_received', { message, channelId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send channel message' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId.toString());
        await User.findByIdAndUpdate(socket.userId, { onlineStatus: 'offline', lastActiveAt: new Date() });
        io.emit('user_offline', { userId: socket.userId });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return { onlineUsers };
};

export const getOnlineUsers = () => onlineUsers;
