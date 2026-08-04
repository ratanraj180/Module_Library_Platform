const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const { uploadArtifact } = require('../middleware/upload');
const { scanUpload } = require('../middleware/scanUpload');
const validate = require('../middleware/validate');
const {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
  submitForReview,
  approveModule,
  rejectModule,
  downloadModule,
  getApprovalQueue,
  syncModuleGithub,
} = require('../controllers/moduleController');

const router = express.Router();

const VALID_CATEGORIES = ['Frontend', 'Backend', 'Database', 'Utility', 'DevOps', 'Other'];

// Validation checks for creating/updating modules
const moduleValidationRules = [
  body('title')
    .if((value, { req }) => !req.body.importedFromGithub)
    .trim()
    .notEmpty()
    .withMessage('Title is required'),
  body('description')
    .if((value, { req }) => !req.body.importedFromGithub)
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('category')
    .if((value, { req }) => !req.body.importedFromGithub)
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('technology')
    .if((value, { req }) => !req.body.importedFromGithub)
    .trim()
    .notEmpty()
    .withMessage('Technology stack is required'),
  body('repositoryUrl').trim().isURL().withMessage('A valid repository URL is required'),
];

const updateValidationRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`),
  body('technology').optional().trim().notEmpty().withMessage('Technology stack cannot be empty'),
  body('repositoryUrl').optional().trim().isURL().withMessage('A valid repository URL is required'),
];

/**
 * @route   GET /api/modules/queue
 * @desc    Get all modules submitted for review (admin only)
 * @access  Private (Admin)
 */
router.get('/queue', auth, allowRoles('admin'), getApprovalQueue);

router.get('/', auth, allowRoles('developer', 'admin'), getModules);

/**
 * @route   POST /api/modules
 * @desc    Create a new module
 * @access  Private (Developer & Admin)
 */
router.post(
  '/',
  auth,
  allowRoles('developer', 'admin'),
  uploadArtifact,          // 1. Save file to disk via multer
  scanUpload,              // 2. Malware scan — rejects upload if threat detected
  moduleValidationRules,   // 3. Validate request body fields
  validate,                // 4. Return 422 if validation failed
  createModule,            // 5. Persist module to DB
);

router.get('/:id', auth, allowRoles('developer', 'admin'), getModuleById);

/**
 * @route   PATCH /api/modules/:id
 * @desc    Update module details
 * @access  Private (Owner/Admin)
 */
router.patch('/:id', auth, updateValidationRules, validate, updateModule);

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module and cascade delete associated records
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', auth, deleteModule);

/**
 * @route   PATCH /api/modules/:id/submit
 * @desc    Submit module for review
 * @access  Private (Maintainer & Developer)
 */
router.patch('/:id/submit', auth, allowRoles('developer'), submitForReview);

/**
 * @route   PATCH /api/modules/:id/approve
 * @desc    Approve a module (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/approve', auth, allowRoles('admin'), approveModule);

/**
 * @route   PATCH /api/modules/:id/reject
 * @desc    Reject a module (admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/reject', auth, allowRoles('admin'), rejectModule);

/**
 * @route   GET /api/modules/:id/download
 * @desc    Download an approved module
 * @access  Private
 */
router.get('/:id/download', auth, downloadModule);

/**
 * @route   POST /api/modules/:id/sync
 * @desc    Sync GitHub metadata
 * @access  Private
 */
router.post('/:id/sync', auth, syncModuleGithub);

module.exports = router;
