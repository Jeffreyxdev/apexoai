# ApexoAI Backend v2.0

> AI-powered career platform backend with resume building, cover letter generation, and intelligent job recommendations

## 🚀 Features

### Core Capabilities
- **AI Chat Engine**: Real-time conversational AI powered by OpenAI GPT-4
- **Resume Builder**: CRUD operations with AI-assisted editing and optimization
- **Cover Letter Generator**: Personalized cover letters based on job descriptions
- **Job Recommendations**: AI-powered job matching and search integration
- **Document Export**: PDF, DOCX generation with multiple templates
- **Analytics Dashboard**: Track user behavior and AI usage metrics
- **Payment Integration**: Stripe integration for premium plans

### Technical Features
- JWT + OAuth2 authentication (Google, LinkedIn)
- Redis caching for sessions and chat context
- WebSocket support for real-time updates
- Rate limiting and security best practices
- Comprehensive error handling and logging
- Scalable microservices-ready architecture

## 📋 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0 (or PostgreSQL with Prisma)
- Redis >= 7.0
- OpenAI API key
- Stripe account (for payments)

## 🛠️ Installation

```bash
# Clone repository
git clone https://github.com/yourusername/apexoai-backend.git
cd apexoai-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start MongoDB and Redis
# macOS/Linux with Homebrew:
brew services start mongodb-community
brew services start redis

# Start development server
npm run dev
```

## 📁 Project Structure

```
apexoai-backend/
├── config/
│   ├── database.js          # Database connection
│   └── redis.js             # Redis configuration
├── controllers/             # Route controllers
│   ├── auth.controller.js
│   ├── resume.controller.js
│   ├── chat.controller.js
│   └── ...
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Global error handler
│   └── validation.js       # Request validation
├── models/
│   ├── User.model.js       # User schema
│   ├── Resume.model.js     # Resume schema
│   ├── ChatSession.model.js
│   └── ...
├── routes/
│   ├── auth.routes.js      # Auth endpoints
│   ├── resume.routes.js    # Resume CRUD
│   ├── chat.routes.js      # AI chat endpoints
│   └── ...
├── services/
│   ├── ai.service.js       # OpenAI integration
│   ├── email.service.js    # Email notifications
│   ├── payment.service.js  # Stripe integration
│   └── socket.service.js   # WebSocket handlers
├── utils/
│   ├── validators.js       # Custom validators
│   ├── helpers.js          # Helper functions
│   └── constants.js        # App constants
├── logs/                    # Application logs
├── uploads/                 # File uploads
├── .env.example            # Environment template
├── server.js               # Application entry point
└── package.json
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login with email/password
POST   /api/auth/google            Google OAuth login
POST   /api/auth/linkedin          LinkedIn OAuth login
POST   /api/auth/refresh           Refresh access token
GET    /api/auth/me                Get current user
POST   /api/auth/logout            Logout user
```

### Resume Management
```
POST   /api/resumes                Create new resume
GET    /api/resumes                Get all user resumes
GET    /api/resumes/:id            Get specific resume
PUT    /api/resumes/:id            Update resume
DELETE /api/resumes/:id            Delete resume
POST   /api/resumes/:id/clone      Clone resume
POST   /api/resumes/:id/enhance    AI-enhance section
GET    /api/resumes/:id/analyze    Get ATS analysis
```

### Chat & AI
```
POST   /api/chat/sessions          Create chat session
GET    /api/chat/sessions          Get all sessions
GET    /api/chat/sessions/:id      Get session with messages
POST   /api/chat/sessions/:id/messages  Send message (SSE stream)
POST   /api/chat/quick             Quick one-off AI query
DELETE /api/chat/sessions/:id      Delete session
```

### Cover Letters
```
POST   /api/cover-letters          Create cover letter
GET    /api/cover-letters          Get all cover letters
POST   /api/cover-letters/generate AI-generate from job desc
GET    /api/cover-letters/:id      Get specific letter
PUT    /api/cover-letters/:id      Update letter
DELETE /api/cover-letters/:id      Delete letter
```

### Job Search
```
GET    /api/jobs/search            Search jobs (external API)
POST   /api/jobs/match             Get AI job matches
GET    /api/jobs/recommendations   Personalized recommendations
POST   /api/jobs/save              Save job posting
GET    /api/jobs/saved             Get saved jobs
```

### Documents
```
POST   /api/documents/pdf          Generate PDF
POST   /api/documents/docx         Generate DOCX
GET    /api/documents/:id/download Download document
```

### Payments
```
GET    /api/payments/plans         Get pricing plans
POST   /api/payments/checkout      Create checkout session
POST   /api/payments/webhook       Stripe webhook handler
GET    /api/payments/subscription  Get subscription status
POST   /api/payments/cancel        Cancel subscription
```

### Analytics
```
GET    /api/analytics/dashboard    User dashboard stats
GET    /api/analytics/usage        AI usage statistics
GET    /api/admin/analytics        Admin analytics (admin only)
```

## 🔐 Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Core
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Security
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret

# OpenAI
OPENAI_API_KEY=sk-...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=...
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Deploy to Render

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables
4. Deploy!

### Deploy to AWS

```bash
# Install AWS CLI and configure
aws configure

# Build and deploy
npm run build
# Follow AWS deployment guide
```

### Deploy to Vercel (Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📊 Database Schemas

### User Model
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: ['user', 'admin', 'premium'],
  plan: ['free', 'basic', 'professional', 'enterprise'],
  tokens: {
    aiCredits: Number,
    refreshToken: String
  },
  profile: { ... },
  preferences: { ... },
  analytics: { ... }
}
```

### Resume Model
```javascript
{
  userId: ObjectId,
  title: String,
  personalInfo: { ... },
  summary: String,
  experience: [{ ... }],
  education: [{ ... }],
  skills: [{ ... }],
  projects: [{ ... }],
  template: String,
  metadata: {
    atsScore: Number,
    completeness: Number,
    wordCount: Number
  }
}
```

### Chat Session Model
```javascript
{
  userId: ObjectId,
  title: String,
  messages: [{
    role: String,
    content: String,
    timestamp: Date,
    metadata: { tokens, model }
  }],
  context: { type, relatedResumeId, ... },
  metadata: { totalTokens, lastMessageAt }
}
```

## 🔧 Configuration

### Rate Limiting
```javascript
// Global rate limit: 100 requests per 15 minutes
// AI endpoints: 10 requests per hour
```

### AI Credits System
```
Free Tier: 50 credits
Basic Plan: 500 credits/month
Pro Plan: Unlimited
Enterprise: Custom
```

### Credit Costs
```
Chat message: 1 credit
Resume enhancement: 2 credits
Cover letter generation: 3 credits
Job analysis: 2 credits
```

## 📝 Best Practices

### Error Handling
```javascript
try {
  // Your code
} catch (error) {
  logger.error('Error description:', error);
  res.status(500).json({
    success: false,
    message: 'User-friendly error message'
  });
}
```

### Async/Await
```javascript
// Always use async/await with proper error handling
router.post('/endpoint', async (req, res) => {
  try {
    const result = await someAsyncOperation();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

### Security
- Always validate and sanitize inputs
- Use parameterized queries (Mongoose handles this)
- Implement rate limiting on sensitive endpoints
- Hash passwords with bcrypt (10+ rounds)
- Use HTTPS in production
- Implement CORS properly
- Keep dependencies updated

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Restart MongoDB
brew services restart mongodb-community
```

### Redis Connection Issues
```bash
# Check Redis
redis-cli ping

# Should return PONG
```

### OpenAI API Errors
- Check API key is valid
- Ensure sufficient credits
- Verify rate limits not exceeded
- Check model availability

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [Socket.IO Documentation](https://socket.io/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Support

- Email: support@apexoai.com
- Discord: [ApexoAI Community](#)
- Documentation: [docs.apexoai.com](#)

## 🎯 Roadmap

- [ ] Voice-to-text for resume building (Whisper API)
- [ ] LinkedIn profile import and analysis
- [ ] Advanced job scraping from multiple sources
- [ ] Mobile app API enhancements
- [ ] Multi-language support
- [ ] Resume video generation
- [ ] Interview simulation with AI
- [ ] Salary negotiation assistant

---

Built with ❤️ by the ApexoAI Team