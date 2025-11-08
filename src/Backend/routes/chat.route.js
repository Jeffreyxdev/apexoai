import express from 'express';
import { body } from 'express-validator';
import ChatSession from '../models/ChatSession.model.js';
import User from '../models/user.model.js';
import { protect, checkCredits } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import aiService from '../service/ai.service.js';

const router = express.Router();

// POST /api/chat/sessions
router.post('/sessions', protect, async (req, res) => {
  try {
    const { title, context } = req.body;

    const session = await ChatSession.create({
      userId: req.user._id,
      title: title || 'New Conversation',
      context: context || { type: 'general' }
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    const sessions = await ChatSession.find({
      userId: req.user._id,
      status: 'active'
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .skip(skip)
      .limit(parseInt(String(limit)))
      .select('title metadata.lastMessageAt metadata.totalMessages context.type');

    const total = await ChatSession.countDocuments({ userId: req.user._id, status: 'active' });

    res.json({
      success: true,
      sessions,
      pagination: { total, page: parseInt(String(page)), pages: Math.ceil(total / parseInt(String(limit))) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/chat/sessions/:id/messages
router.post('/sessions/:id/messages', [
  protect,
  checkCredits(1),
  body('message').trim().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { message, context } = req.body;
    const sessionId = req.params.id;

    let session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    await session.addMessage('user', message);

    const conversationContext = session.getAIContext(10);
    const systemPrompt = getSystemPrompt(session.context.type, context);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    let tokenCount = 0;

    await aiService.chatStream(
      messages,
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, type: 'content' })}\n\n`);
      },
      { model: 'gemini-1.5-pro', temperature: 0.7 }
    );

    tokenCount = aiService.estimateTokens(message + fullResponse);
    await session.addMessage('assistant', fullResponse, { model: 'gemini-1.5-pro', totalTokens: tokenCount });

    if (!req.hasUnlimitedCredits) {
      const user = await User.findById(req.user._id);
      await user.deductCredits(1);
      res.write(`data: ${JSON.stringify({ type: 'credits', remaining: user.tokens.aiCredits })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
});

// Helper: System prompts
function getSystemPrompt(contextType, additionalContext = {}) {
  const basePrompt = `You are ApexoAI, an advanced AI career assistant specializing in:
- Resume writing and optimization
- Cover letter creation
- Job search strategies
- Interview preparation
- Career development advice
- Professional document creation

You provide practical, actionable advice with a professional yet friendly tone.
You use data and best practices to support your recommendations.`;

  const prompts = {
    general: basePrompt,
    resume_building: `${basePrompt}\n\nYou are currently helping the user build or optimize their resume. Focus on:
- ATS optimization
- Quantifiable achievements
- Strong action verbs
- Proper formatting
- Industry-specific keywords`,
    cover_letter: `${basePrompt}\n\nYou are helping create a compelling cover letter. Focus on:
- Personalization to the company and role
- Highlighting relevant achievements
- Showing enthusiasm and culture fit
- Professional yet engaging tone`,
    job_search: `${basePrompt}\n\nYou are assisting with job search strategies. Focus on:
- Identifying suitable opportunities
- Application tactics
- Networking strategies
- Interview preparation`,
    interview_prep: `${basePrompt}\n\nYou are providing interview coaching. Focus on:
- Common interview questions
- STAR method responses
- Company research tips
- Body language and communication`,
    career_advice: `${basePrompt}\n\nYou are offering career development guidance. Focus on:
- Career path planning
- Skill development
- Professional growth
- Work-life balance`
  };
  
  let prompt = prompts[contextType] || prompts.general;
  if (Object.keys(additionalContext).length) {
    prompt += `\nContext: ${JSON.stringify(additionalContext)}`;
  }
  return prompt;
}

export default router;