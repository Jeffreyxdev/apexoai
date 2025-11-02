import express from 'express';
import { protect } from '../middleware/auth.js';
import CoverLetter from '../models/CoverLetter.model.js'; // create later
import aiService from '../service/ai.service.js';

const router = express.Router();

// Generate cover letter with AI
router.post('/generate', protect, async (req, res) => {
  const { jobTitle, jobDescription, resumeSummary } = req.body;
  const prompt = `Generate a personalized cover letter for the position of ${jobTitle}. 
  Job Description: ${jobDescription}. Resume Summary: ${resumeSummary}`;

  const content = await aiService.getResponse(prompt);
  const coverLetter = await CoverLetter.create({
    user: req.user._id,
    jobTitle,
    jobDescription,
    content,
  });

  res.json(coverLetter);
});

export default router;
