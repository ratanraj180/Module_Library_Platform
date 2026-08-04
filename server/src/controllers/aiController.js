const geminiService = require('../services/geminiService');

/**
 * POST /api/ai/chat
 * Route controller for standalone chat interactions.
 */
async function chat(req, res, next) {
  try {
    const { message, temperature, maxOutputTokens } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty text message field is required.'
      });
    }

    try {
      const result = await geminiService.generateResponse(message, {
        temperature,
        maxOutputTokens
      });

      return res.status(200).json({
        success: true,
        answer: result.answer,
        model: result.model,
        latency: result.latency,
        usage: result.usage
      });
    } catch (apiErr) {
      console.error('[aiController] Gemini interaction failure:', apiErr.message);
      // Clean production response
      return res.status(502).json({
        success: false,
        message: 'The AI assistant is temporarily unavailable. Please try again later.'
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  chat
};