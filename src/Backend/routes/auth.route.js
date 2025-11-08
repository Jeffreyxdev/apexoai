import express from 'express';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { validateRequest } from '../middleware/validation.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
const router = express.Router();

// ======================
// REGISTER
// ======================
router.post('/register', async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

   
   const user = await User.create({
  firstname,
  lastname,
  email: email.toLowerCase(),
  password,
});


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });


    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ======================
// LOGIN
// ======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('Login failed: No user found with email', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      console.log('Entered password:', password);
      console.log('Stored password hash:', user.password);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Login successful
    console.log('Login successful for', email);

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});


// REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Issue new access token
    const accessToken = jwt.sign({ id: payload.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});


// ======================
// PROFILE
// ======================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id)
      .select('-passwordHash -tokens.refreshToken');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.profile?.firstname || user.name.split(' ')[0],
        lastName: user.profile?.lastname || user.name.split(' ').slice(1).join(' '),
        fullName: user.name,
        email: user.email,
        avatar: user.profile?.avatar,
        phone: user.profile?.phone,
        location: user.profile?.location,
        bio: user.profile?.bio,
        title: user.profile?.title,
        linkedinUrl: user.profile?.linkedinUrl,
        plan: user.plan,
        aiCredits: user.tokens.aiCredits,
        preferences: user.preferences,
        analytics: user.analytics
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// @route   PATCH /api/users/profile
// @desc    Update user profile
// @access  Private
router.patch('/profile', [
  protect,
  body('firstname').optional().trim(),
  body('lastname').optional().trim(),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('bio').optional().trim(),
  body('title').optional().trim(),
  validateRequest
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { firstName, lastName, phone, location, bio, title, linkedinUrl, githubUrl, portfolioUrl } = req.body;

    // Update name if firstName or lastName changed
    if (firstName || lastName) {
      const newFirstName = firstName || user.profile?.firstname || user.name.split(' ')[0];
      const newLastName = lastName || user.profile?.lastname || user.name.split(' ').slice(1).join(' ');
      user.name = `${newFirstName} ${newLastName}`.trim();
    }

    // Update profile fields
    user.profile = {
      ...user.profile,
      firstName: firstname || user.profile?.firstname,
      lastName: lastname || user.profile?.lastname,
      phone: phone || user.profile?.phone,
      location: location || user.profile?.location,
      bio: bio || user.profile?.bio,
      title: title || user.profile?.title,
      linkedinUrl: linkedinUrl || user.profile?.linkedinUrl,
      githubUrl: githubUrl || user.profile?.githubUrl,
      portfolioUrl: portfolioUrl || user.profile?.portfolioUrl
    };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        firstName: user.profile.firstname,
        lastName: user.profile.lastname,
        fullName: user.name,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   GET /api/users/settings
// @desc    Get user settings/preferences
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    
    res.json({
      success: true,
      settings: {
        preferences: user.preferences,
        notifications: {
          emailNotifications: user.preferences.emailNotifications,
          weeklyTips: user.preferences.weeklyTips,
          jobAlerts: user.preferences.jobAlerts
        },
        plan: user.plan,
        aiCredits: user.tokens.aiCredits
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// @route   PATCH /api/users/settings
// @desc    Update user settings
// @access  Private
router.patch('/settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { emailNotifications, weeklyTips, jobAlerts } = req.body;

    // Update preferences
    if (emailNotifications !== undefined) {
      user.preferences.emailNotifications = emailNotifications;
    }
    if (weeklyTips !== undefined) {
      user.preferences.weeklyTips = weeklyTips;
    }
    if (jobAlerts !== undefined) {
      user.preferences.jobAlerts = jobAlerts;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.preferences
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

export default router;

// ============================================
// ENHANCED CHAT ROUTES (routes/chat.routes.js)
// Add these to existing chat routes
// ============================================

// @route   GET /api/chat/history
// @desc    Get chat history with grouping (Today, Yesterday, 7 days ago, etc.)
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const sessions = await ChatSession.find({
      userId,
      status: 'active'
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .select('title metadata.lastMessageAt metadata.totalMessages createdAt')
      .lean();

    // Group sessions by time periods
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const grouped = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: []
    };

    sessions.forEach(session => {
      const lastMessage = new Date(session.metadata.lastMessageAt);
      
      if (lastMessage >= today) {
        grouped.today.push(session);
      } else if (lastMessage >= yesterday) {
        grouped.yesterday.push(session);
      } else if (lastMessage >= sevenDaysAgo) {
        grouped.last7Days.push(session);
      } else if (lastMessage >= thirtyDaysAgo) {
        grouped.last30Days.push(session);
      } else {
        grouped.older.push(session);
      }
    });

    res.json({
      success: true,
      history: grouped,
      total: sessions.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

// @route   GET /api/chat/search
// @desc    Search through chat sessions and messages
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, limit = 20, page = 1 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const userId = req.user._id || req.user.id;
    
    // Search in session titles
    const titleResults = await ChatSession.find({
      userId,
      status: 'active',
      title: { $regex: query, $options: 'i' }
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('title metadata.lastMessageAt metadata.totalMessages createdAt');

    // Search in message content
    const messageResults = await ChatSession.find({
      userId,
      status: 'active',
      'messages.content': { $regex: query, $options: 'i' }
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Format message results with matching snippets
    const formattedMessageResults = messageResults.map(session => {
      const matchingMessages = session.messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase())
      );

      return {
        sessionId: session._id,
        title: session.title,
        lastMessageAt: session.metadata.lastMessageAt,
        matchingMessages: matchingMessages.slice(0, 3).map(msg => ({
          role: msg.role,
          snippet: msg.content.substring(0, 150) + '...',
          timestamp: msg.timestamp
        }))
      };
    });

    const totalResults = titleResults.length + messageResults.length;

    res.json({
      success: true,
      results: {
        titleMatches: titleResults,
        messageMatches: formattedMessageResults,
        total: totalResults
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: totalResults >= parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// @route   GET /api/chat/suggestions
// @desc    Get personalized chat suggestions based on history
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get recent sessions to analyze patterns
    const recentSessions = await ChatSession.find({
      userId,
      status: 'active'
    })
      .sort({ 'metadata.lastMessageAt': -1 })
      .limit(10)
      .select('context messages');

    // Analyze common topics
    const topics = new Map();
    recentSessions.forEach(session => {
      if (session.context?.type) {
        topics.set(session.context.type, (topics.get(session.context.type) || 0) + 1);
      }
    });

    // Generate suggestions based on common topics
    const suggestionsByTopic = {
      resume_building: [
        "Help me optimize my resume for ATS",
        "Review my work experience section",
        "Suggest skills to add to my resume"
      ],
      cover_letter: [
        "Write a cover letter for [job title]",
        "How do I personalize my cover letter?",
        "Review my cover letter draft"
      ],
      job_search: [
        "Find jobs matching my skills",
        "How to prepare for interviews?",
        "Tips for salary negotiation"
      ],
      career_advice: [
        "What career path should I consider?",
        "How to transition to a new industry?",
        "Skills to learn for career growth"
      ],
      general: [
        "What's something you've learned recently?",
        "Help me plan my week",
        "Tips for productivity"
      ]
    };

    // Get top 3 most common topics
    const topTopics = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    const suggestions = {
      today: topTopics.length > 0 
        ? suggestionsByTopic[topTopics[0]] || suggestionsByTopic.general
        : suggestionsByTopic.general,
      pastWeek: suggestionsByTopic[topTopics[1] || 'general'],
      popular: [
        "Create a professional resume",
        "Help me prepare for an interview",
        "Analyze this job description"
      ]
    };

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
});

// @route   DELETE /api/chat/history/clear
// @desc    Clear all chat history (archive sessions)
// @access  Private
router.delete('/history/clear', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const result = await ChatSession.updateMany(
      { userId, status: 'active' },
      { status: 'archived' }
    );

    res.json({
      success: true,
      message: 'Chat history cleared',
      archived: result.modifiedCount
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history'
    });
  }
});