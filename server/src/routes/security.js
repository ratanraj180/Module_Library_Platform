/**
 * @file security.js
 * @description Express router for the Security Scanning Pipeline API.
 *
 * All routes are mounted under /api/security (registered in app.js).
 * Every route requires JWT authentication via the `auth` middleware.
 * RBAC is applied per-route using `allowRoles` from the role middleware.
 *
 * Route Summary:
 * ┌─────────────────────────────────────────┬───────────────────────────────────────────┐
 * │ Route                                   │ Description                               │
 * ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 * │ POST /api/security/scan/:moduleId       │ Start a new security scan for a module    │
 * │ GET  /api/security/report/:moduleId     │ Get the latest security report            │
 * │ POST /api/security/rescan/:moduleId     │ Manually trigger a re-scan                │
 * │ GET  /api/security/history/:moduleId    │ Get paginated scan history for a module   │
 * └─────────────────────────────────────────┴───────────────────────────────────────────┘
 */

const express = require('express');

const auth = require('../middleware/auth');
const { allowRoles } = require('../middleware/role');
const {
  startScan,
  getReport,
  rescan,
  getHistory,
} = require('../controllers/securityController');

const router = express.Router();

/**
 * @route   POST /api/security/scan/:moduleId
 * @desc    Initiate a new security scan for the specified module.
 *          Returns 202 Accepted immediately; the scan runs asynchronously.
 *          Poll GET /api/security/report/:moduleId for results.
 * @access  Private (developer, admin)
 */
// Legacy routes for backward compatibility
router.post('/scan/:moduleId', auth, allowRoles('developer', 'admin'), startScan);
router.get('/report/:moduleId', auth, allowRoles('developer', 'admin'), getReport);
router.post('/rescan/:moduleId', auth, allowRoles('developer', 'admin'), rescan);
router.get('/history/:moduleId', auth, allowRoles('developer', 'admin'), getHistory);

// Resource-specific routes (Module)
router.post('/scan/module/:moduleId', auth, allowRoles('developer', 'admin'), startScan);
router.get('/report/module/:moduleId', auth, allowRoles('developer', 'admin'), getReport);
router.post('/rescan/module/:moduleId', auth, allowRoles('developer', 'admin'), rescan);
router.get('/history/module/:moduleId', auth, allowRoles('developer', 'admin'), getHistory);

// Resource-specific routes (Component)
router.post('/scan/component/:componentId', auth, allowRoles('developer', 'admin'), startScan);
router.get('/report/component/:componentId', auth, allowRoles('developer', 'admin'), getReport);
router.post('/rescan/component/:componentId', auth, allowRoles('developer', 'admin'), rescan);
router.get('/history/component/:componentId', auth, allowRoles('developer', 'admin'), getHistory);

module.exports = router;
