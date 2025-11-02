import express from 'express';
import { protect } from '../middleware/auth.js';
import ChatSession from '../models/ChatSession.model.js';

const router = express.Router();

// Get usage stats
router.get('/usage', protect, async (req, res) => {
  const chats = await ChatSession.countDocuments({ user: req.user._id });
  res.json({ totalChats: chats });
});

export default router;
