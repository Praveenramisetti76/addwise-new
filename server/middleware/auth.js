const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.',
        code: 'INVALID_TOKEN'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    
    // Convert roles to array if it's a string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

// Specific role middlewares
const requireUser = requireRole('user');
const requireAdmin = requireRole(['admin', 'superadmin']);
const requireSuperAdmin = requireRole('superadmin');

// Middleware to check if user can access specific user data
const canAccessUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.params.id;
    
    if (!targetUserId) {
      return res.status(400).json({ 
        message: 'User ID is required.',
        code: 'USER_ID_REQUIRED'
      });
    }

    // Super admin can access any user
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Admin can access users but not other admins or super admins
    if (req.user.role === 'admin') {
      const targetUser = await User.findById(targetUserId).select('role');
      if (!targetUser) {
        return res.status(404).json({ 
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
        return res.status(403).json({ 
          message: 'Access denied. Cannot access admin or super admin accounts.',
          code: 'ACCESS_DENIED'
        });
      }
      
      return next();
    }

    // Regular users can only access their own data
    if (req.user._id.toString() !== targetUserId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own data.',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  } catch (error) {
    console.error('Can access user middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireUser,
  requireAdmin,
  requireSuperAdmin,
  canAccessUser
}; 