import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { cacheService } from '../config/redis.js';

// Verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user session exists in cache
      const cachedUser = await cacheService.getUserSession(decoded.id);
      
      if (cachedUser) {
        req.user = cachedUser;
      } else {
        // Get user from database
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (!user || !user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists or is inactive'
          });
        }

        // Cache user session
        await cacheService.setUserSession(user._id.toString(), user.toObject(), 3600);
        req.user = user;
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Check AI credits
export const checkCredits = (requiredCredits = 1) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Get fresh user data to check credits
      const user = await User.findById(req.user._id || req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Premium users have unlimited credits
      if (user.isPremium()) {
        req.hasUnlimitedCredits = true;
        return next();
      }

      // Check if user has enough credits
      if (user.tokens.aiCredits < requiredCredits) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient AI credits',
          creditsRequired: requiredCredits,
          creditsAvailable: user.tokens.aiCredits,
          upgradeUrl: '/api/payments/plans'
        });
      }

      req.creditsRequired = requiredCredits;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking AI credits'
      });
    }
  };
};

// Plan-based access control
export const requirePlan = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({
        success: false,
        message: `This feature requires ${plans.join(' or ')} plan`,
        currentPlan: req.user.plan,
        upgradeUrl: '/api/payments/plans'
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail - continue as unauthenticated
      }
    }

    next();
  } catch (error) {
    next();
  }
};