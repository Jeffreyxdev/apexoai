import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/user.model.js';

const router = express.Router();

// Get all users (admin)
router.get('/', protect, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

export default router;
