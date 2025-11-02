import express from 'express';
import { body } from 'express-validator';
import ChatSession from '../models/ChatSession.model.js';
import User from '../models/user.model.js';
import { protect, checkCredits } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import aiService from '../service/ai.service.js';
import { cacheService } from '../config/redis.js';

const router = express.Router();

// @route   POST /api/chat/sessions
// @desc    Create new chat session
// @access  Private
router.post('/sessions', protect, async (req, res) => {
  try {
    const { title, context } = req.body;

    const session = await ChatSession.create({
      userId: req.user._id || req.user.id,
      title: title || 'New Conversation',
      context: context || { type: 'general' }
    });

    res.status(201).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session'
    });
  }
});

// @route   GET /api/chat/sessions
// @desc    Get all user chat sessions
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const { status = 'active', limit = 20, page = 1 } = req.query;

    const sessions = await ChatSession.find({
      userId: req.user._id || req.user.id,
      status
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-messages'); // Don't send full messages in list view

    const total = await ChatSession.countDocuments({
      userId: req.user._id || req.user.id,
      status
    });

    res.json({
      success: true,
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat sessions'
    });
  }
});

// @route   GET /api/chat/sessions/:id
// @desc    Get specific chat session with messages
// @access  Private
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id || req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat session'
    });
  }
});

// @route   POST /api/chat/sessions/:id/messages
// @desc    Send message and get AI response
// @access  Private
router.post('/sessions/:id/messages', [
  protect,
  checkCredits(1),
  body('message').trim().notEmpty().withMessage('Message is required'),
  validateRequest
], async (req, res) => {
  try {
    const { message, context } = req.body;
    const sessionId = req.params.id;

    // Get or create session
    let session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user._id || req.user.id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Add user message
    await session.addMessage('user', message);

    // Prepare AI context from conversation history
    const conversationContext = session.getAIContext(10);
    
    // Add system context based on session type
    const systemPrompt = getSystemPrompt(session.context.type, context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    let tokenCount = 0;

    // Stream AI response
    await aiService.chatStream(
      messages,
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, type: 'content' })}\n\n`);
      },
      {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 2000
      }
    );

    // Estimate tokens
    tokenCount = aiService.estimateTokens(message + fullResponse);

    // Save AI response
    await session.addMessage('assistant', fullResponse, {
      model: 'gemini-2.0-pro',
      totalTokens: tokenCount
    });

    // Deduct credits if not premium
    if (!req.hasUnlimitedCredits) {
      const user = await User.findById(req.user._id || req.user.id);
      await user.deductCredits(req.creditsRequired);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'credits',
        remaining: user.tokens.aiCredits 
      })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat message error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to process message',
        error: error.message
      });
    } else {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message 
      })}\n\n`);
      res.end();
    }
  }
});

// @route   DELETE /api/chat/sessions/:id
// @desc    Delete chat session
// @access  Private
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id || req.user.id
      },
      { status: 'deleted' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session'
    });
  }
});

// @route   PATCH /api/chat/sessions/:id
// @desc    Update chat session (title, archive, etc.)
// @access  Private
router.patch('/sessions/:id', protect, async (req, res) => {
  try {
    const { title, status } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (status) updates.status = status;

    const session = await ChatSession.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id || req.user.id
      },
      updates,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat session'
    });
  }
});

// @route   POST /api/chat/quick
// @desc    Quick AI chat without session (one-off questions)
// @access  Private
router.post('/quick', [
  protect,
  checkCredits(1),
  body('message').trim().notEmpty().withMessage('Message is required'),
  validateRequest
], async (req, res) => {
  try {
    const { message, context } = req.body;

    const systemPrompt = getSystemPrompt('general', context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    const response = await aiService.chat(messages, {
      model: 'gemini-2.0-pro',
      temperature: 0.7
    });

    // Deduct credits
    if (!req.hasUnlimitedCredits) {
      const user = await User.findById(req.user._id || req.user.id);
      await user.deductCredits(req.creditsRequired);
    }

    res.json({
      success: true,
      response: response.content,
      usage: response.usage
    });

  } catch (error) {
    console.error('Quick chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message'
    });
  }
});

// Helper function to get system prompts based on context
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

  const contextPrompts = {
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

  let prompt = contextPrompts[contextType] || contextPrompts.general;

  if (additionalContext && Object.keys(additionalContext).length > 0) {
    prompt += `\n\nAdditional context: ${JSON.stringify(additionalContext, null, 2)}`;
  }

  return prompt;
}

export default router;