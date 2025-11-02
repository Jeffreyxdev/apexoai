import express from 'express';
import { protect } from '../middleware/auth.js';
import Resume from '../models/Resume.model.js'; // create later

const router = express.Router();

// Create resume
router.post('/', protect, async (req, res) => {
  const resume = await Resume.create({ user: req.user._id, ...req.body });
  res.json(resume);
});

// Get all resumes
router.get('/', protect, async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id });
  res.json(resumes);
});

export default router;
