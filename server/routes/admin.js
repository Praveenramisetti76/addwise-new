const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const QrCode = require('../models/QrCode');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/users', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', isActive = '' } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error while fetching users',
      code: 'USERS_FETCH_ERROR'
    });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get('/users/:userId', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Admin cannot access super admin accounts
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Access denied. Cannot access super admin accounts.',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Server error while fetching user',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/users/:userId', [
  authenticateToken,
  requireAdmin,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('phoneNumber')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  body('position')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Position cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, role, isActive, phoneNumber, department, position } = req.body;

    // Check if user exists
    const existingUser = await User.findById(req.params.userId);
    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Admin cannot modify super admin accounts
    if (existingUser.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Access denied. Cannot modify super admin accounts.',
        code: 'ACCESS_DENIED'
      });
    }

    // Regular admin cannot promote users to admin role
    if (role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Access denied. Only super admin can promote users to admin role.',
        code: 'ACCESS_DENIED'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(phoneNumber && { phoneNumber }),
        ...(department && { department }),
        ...(position && { position })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      message: 'Server error while updating user',
      code: 'USER_UPDATE_ERROR'
    });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/users/:userId', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    // Check if user exists
    const existingUser = await User.findById(req.params.userId);
    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Admin cannot delete super admin accounts
    if (existingUser.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Access denied. Cannot delete super admin accounts.',
        code: 'ACCESS_DENIED'
      });
    }

    // Regular admin cannot delete other admin accounts
    if (existingUser.role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Access denied. Cannot delete admin accounts.',
        code: 'ACCESS_DENIED'
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.params.userId);

    res.json({
      message: 'User deleted successfully',
      code: 'USER_DELETED'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error while deleting user',
      code: 'USER_DELETE_ERROR'
    });
  }
});

// @route   POST /api/admin/users/:userId/activate
// @desc    Activate user account (admin only)
// @access  Private (Admin)
router.post('/users/:userId/activate', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'User activated successfully',
      user
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      message: 'Server error while activating user',
      code: 'USER_ACTIVATE_ERROR'
    });
  }
});

// @route   POST /api/admin/users/:userId/deactivate
// @desc    Deactivate user account (admin only)
// @access  Private (Admin)
router.post('/users/:userId/deactivate', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      message: 'Server error while deactivating user',
      code: 'USER_DEACTIVATE_ERROR'
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get('/dashboard', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const userRoleCount = await User.countDocuments({ role: 'user' });
    const adminRoleCount = await User.countDocuments({ role: 'admin' });
    const superAdminRoleCount = await User.countDocuments({ role: 'superadmin' });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        userRoleCount,
        adminRoleCount,
        superAdminRoleCount,
        recentUsers
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      message: 'Server error while fetching dashboard stats',
      code: 'DASHBOARD_STATS_ERROR'
    });
  }
});

// @route   POST /api/admin/qrcodes
// @desc    Save generated QR codes
// @access  Admin only
router.post('/qrcodes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { codes } = req.body;
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: 'No codes provided' });
    }
    const qrDocs = codes.map(code => ({ code, createdBy: req.user._id }));
    const savedCodes = await QrCode.insertMany(qrDocs, { ordered: false });
    res.status(201).json({ success: true, codes: savedCodes });
  } catch (error) {
    // Handle duplicate codes gracefully
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Some codes already exist' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 