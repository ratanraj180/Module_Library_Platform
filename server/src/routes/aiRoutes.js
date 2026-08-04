const express = require('express');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/ai/chat
 * Dedicated route for raw chat queries
 */
router.post('/chat', auth.optional, aiController.chat);

module.exports = router;