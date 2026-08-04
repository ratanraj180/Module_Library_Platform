const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  createComponent,
  getComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
  submitForReview,
  approveComponent,
  rejectComponent,
  downloadComponent,
} = require('../controllers/componentController');

const router = express.Router();

const VALID_CATEGORIES = ['UI Components', 'Backend Components'];

const componentValidationRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
];

const updateValidationRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
];

/**
 * @route   GET /api/components
 * @desc    Retrieve all components (filtered by search/category/status/owner, optional auth)
 * @access  Public (Optional Auth)
 */
router.get('/', auth.optional, getComponents);

/**
 * @route   POST /api/components
 * @desc    Create a new component
 * @access  Private (Developer & Admin)
 */
router.post(
  '/',
  auth,
  allowRoles('developer', 'admin'),
  componentValidationRules,
  validate,
  createComponent,
);

/**
 * @route   GET /api/components/:id
 * @desc    Get detailed component information by ID
 * @access  Public (Optional Auth)
 */
router.get('/:id', auth.optional, getComponentById);

/**
 * @route   PATCH /api/components/:id/submit
 * @desc    Submit component for review
 * @access  Private (Developer & Admin)
 */
router.patch('/:id/submit', auth, allowRoles('developer', 'admin'), submitForReview);

/**
 * @route   PATCH /api/components/:id
 * @desc    Update component details
 * @access  Private (Owner/Admin)
 */
router.patch('/:id', auth, updateValidationRules, validate, updateComponent);

/**
 * @route   DELETE /api/components/:id
 * @desc    Delete a component
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', auth, deleteComponent);

/**
 * @route   PATCH /api/components/:id/approve
 * @desc    Approve a component (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/approve', auth, allowRoles('admin'), approveComponent);

/**
 * @route   PATCH /api/components/:id/reject
 * @desc    Reject a component (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/reject', auth, allowRoles('admin'), rejectComponent);

/**
 * @route   GET /api/components/:id/download
 * @desc    Download/Track download of a component
 * @access  Public (Optional Auth)
 */
router.get('/:id/download', auth.optional, downloadComponent);

module.exports = router;
