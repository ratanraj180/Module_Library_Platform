const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

const VALID_STATUSES = ['approved', 'rejected'];

// Validation rules for reviews
const reviewValidationRules = [
  body('moduleId').isMongoId().withMessage('A valid Module ID is required'),
  body('status')
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('comment').optional().trim().isString().withMessage('Comment must be a string'),
];

const updateReviewValidationRules = [
  body('status')
    .optional()
    .isIn(VALID_STATUSES)
    .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('comment').optional().trim().isString().withMessage('Comment must be a string'),
];

/**
 * @route   POST /api/reviews
 * @desc    Create a review for a module
 * @access  Private
 */
router.post('/', auth, reviewValidationRules, validate, createReview);

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews, with optional query filter for module (moduleId)
 * @access  Private
 */
router.get('/', auth, getReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get details of a specific review
 * @access  Private
 */
router.get('/:id', auth, getReviewById);

/**
 * @route   PATCH /api/reviews/:id
 * @desc    Update a review
 * @access  Private (Author/Admin)
 */
router.patch('/:id', auth, updateReviewValidationRules, validate, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (Author/Admin)
 */
router.delete('/:id', auth, deleteReview);

module.exports = router;
