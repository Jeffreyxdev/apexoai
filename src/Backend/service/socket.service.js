import { Server } from 'socket.io';
import { cacheService } from '../config/redis.js';
import aiService from './ai.service.js';
import ChatSession from '../models/ChatSession.model.js';
import User from '../models/user.model.js';

export const initSocketHandlers = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('✅ Socket.io initialized');

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    // Join user-specific room for private communication
    socket.on('joinRoom', async ({ userId, sessionId }) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined room ${sessionId}`);
    });

    // Listen for chat messages from client
    socket.on('userMessage', async ({ userId, sessionId, message }) => {
      try {
        // Cache key for context
        const cacheKey = `chat:${userId}:${sessionId}`;
        let chatHistory = await cacheService.get(cacheKey);
        chatHistory = chatHistory ? JSON.parse(chatHistory) : [];

        // Add user's message
        chatHistory.push({ role: 'user', content: message });

        // Emit "typing" state to client
        io.to(userId).emit('aiTyping', { status: true });

        // Get AI response
        const aiReply = await aiService.getResponse(message, chatHistory);

        chatHistory.push({ role: 'assistant', content: aiReply });
        await cacheService.set(cacheKey, JSON.stringify(chatHistory), 3600);

        // Save to MongoDB
        let session = await ChatSession.findById(sessionId);
        if (session) {
          session.messages.push({ role: 'user', content: message });
          session.messages.push({ role: 'assistant', content: aiReply });
          await session.save();
        } else {
          session = await ChatSession.create({
            user: userId,
            messages: chatHistory,
          });
        }

        // Deduct credits
        await User.findByIdAndUpdate(userId, { $inc: { credits: -1 } });

        // Emit AI response back to client
        io.to(userId).emit('aiResponse', {
          message: aiReply,
          sessionId,
        });

        io.to(userId).emit('aiTyping', { status: false });
      } catch (err) {
        console.error('Socket error:', err);
        io.to(userId).emit('error', { message: 'Something went wrong' });
      }
    });

    // Typing indicator from user
    socket.on('userTyping', ({ userId, typing }) => {
      io.to(userId).emit('userTyping', { typing });
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
  });
};
