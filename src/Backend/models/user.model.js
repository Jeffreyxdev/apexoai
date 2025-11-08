import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Core Identity & Auth
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  // 'name' is used by the register/profile patch routes to store the full name
  name: { type: String }, 
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  googleId: { type: String },

  // Subscription and Credits
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  tokens: {
    aiCredits: { type: Number, default: 100 }
  },

  // Profile Details (used by /profile routes)
  profile: {
    firstname: { type: String, trim: true }, // Optional explicit first/last name storage
    lastname: { type: String, trim: true },
    avatar: { type: String },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    bio: { type: String, trim: true },
    title: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
  },

  // User Settings and Preferences (used by /settings routes)
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    weeklyTips: { type: Boolean, default: true },
    jobAlerts: { type: Boolean, default: false },
    // Add other preference fields as needed
  },

  // Analytics/Usage Tracking
  analytics: {
    lastLogin: { type: Date, default: Date.now },
    totalChats: { type: Number, default: 0 },
  }

}, { timestamps: true });

// Add premium check
userSchema.methods.isPremium = function() {
  return this.plan === 'pro' || this.plan === 'enterprise';
};

// Virtual for display name (used to provide a clean name if root fields aren't used)
userSchema.virtual('displayName').get(function() {
  return this.name || `${this.firstname} ${this.lastname}`.trim() || this.email.split('@')[0];
});


// Password encryption middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method (used by the /login route)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;
