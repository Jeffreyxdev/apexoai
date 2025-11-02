import express from 'express';
import { protect } from '../middleware/auth.js';
const router = express.Router();

// Example placeholder for job API
router.get('/recommend', protect, async (req, res) => {
  res.json({
    jobs: [
      { title: 'Frontend Developer', company: 'ApexoAI', location: 'Remote' },
      { title: 'AI Researcher', company: 'TechNova', location: 'Lagos' },
    ],
  });
});

export default router;
