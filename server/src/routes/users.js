const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  getProfile,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
} = require('../controllers/userController');

const router = express.Router();

const ROLES = ['admin', 'developer'];

// Validation rules for Admin creating a user
const createUserValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
];

// Validation rules for Admin updating a user
const updateUserValidationRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean value'),
];

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', auth, getProfile);

/**
 * @route   POST /api/users
 * @desc    Admin creates a user directly
 * @access  Private (Admin Only)
 */
router.post('/', auth, allowRoles('admin'), createUserValidationRules, validate, createUser);

/**
 * @route   GET /api/users
 * @desc    Admin lists all users
 * @access  Private (Admin Only)
 */
router.get('/', auth, allowRoles('admin'), getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Admin retrieves details of a specific user
 * @access  Private (Admin Only)
 */
router.get('/:id', auth, allowRoles('admin'), getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Admin updates details of a specific user
 * @access  Private (Admin Only)
 */
router.put('/:id', auth, allowRoles('admin'), updateUserValidationRules, validate, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Admin deletes a user
 * @access  Private (Admin Only)
 */
router.delete('/:id', auth, allowRoles('admin'), deleteUser);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Admin updates user role (legacy)
 * @access  Private (Admin Only)
 */
router.patch(
  '/:id/role',
  auth,
  allowRoles('admin'),
  [
    body('role')
      .isIn(ROLES)
      .withMessage(`Role must be one of: ${ROLES.join(', ')}`),
  ],
  validate,
  updateRole,
);

module.exports = router;
