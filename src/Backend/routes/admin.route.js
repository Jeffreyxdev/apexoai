import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/user.model.js';
import ChatSession from '../models/ChatSession.model.js';

const router = express.Router();

// Admin overview
router.get('/overview', protect, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalSessions = await ChatSession.countDocuments();
  res.json({ totalUsers, totalSessions });
});

export default router;
