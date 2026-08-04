const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signup, login, getProfile, googleLogin } = require('../controllers/authController');
const router = express.Router();
// Supported User roles in the platform
const VALID_ROLES = ['admin', 'developer'];

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('role')
      .optional()
      .isIn(VALID_ROLES)
      .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  ],
  validate,
  signup,
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login,
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', auth, getProfile);

/**
 * @route   POST /api/auth/google
 * @desc    Google Sign-In
 * @access  Public
 */
router.post(
  '/google',
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  ],
  validate,
  googleLogin,
);



module.exports = router;
