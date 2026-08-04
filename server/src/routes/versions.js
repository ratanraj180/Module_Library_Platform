const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  addVersion,
  getVersions,
  getVersionById,
  updateVersion,
  deleteVersion,
} = require('../controllers/versionController');

const router = express.Router({ mergeParams: true });

// Validation rules for adding/updating a version
const versionValidationRules = [
  body('versionNumber').trim().notEmpty().withMessage('Version number is required'),
  body('changelog').trim().notEmpty().withMessage('Changelog description is required'),
  body('repositoryUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Repository URL must be a valid URL'),
  body('fileUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('File URL must be a valid URL'),
];

const updateVersionValidationRules = [
  body('versionNumber').optional().trim().notEmpty().withMessage('Version number cannot be empty'),
  body('changelog').optional().trim().notEmpty().withMessage('Changelog cannot be empty'),
  body('repositoryUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Repository URL must be a valid URL'),
  body('fileUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('File URL must be a valid URL'),
];

/**
 * @route   POST /api/modules/:moduleId/versions
 * @desc    Add a new version to a module
 * @access  Private (Owner/Admin)
 */
router.post('/:moduleId/versions', auth, versionValidationRules, validate, addVersion);

/**
 * @route   GET /api/modules/:moduleId/versions
 * @desc    Get all versions of a module
 * @access  Private
 */
router.get('/:moduleId/versions', auth, getVersions);

/**
 * @route   GET /api/modules/:moduleId/versions/:versionId
 * @desc    Get details of a specific module version
 * @access  Private
 */
router.get('/:moduleId/versions/:versionId', auth, getVersionById);

/**
 * @route   PUT /api/modules/:moduleId/versions/:versionId
 * @desc    Update a specific module version details
 * @access  Private (Uploader/Owner/Admin)
 */
router.put(
  '/:moduleId/versions/:versionId',
  auth,
  updateVersionValidationRules,
  validate,
  updateVersion,
);

/**
 * @route   DELETE /api/modules/:moduleId/versions/:versionId
 * @desc    Delete a module version
 * @access  Private (Uploader/Owner/Admin)
 */
router.delete('/:moduleId/versions/:versionId', auth, deleteVersion);

module.exports = router;
