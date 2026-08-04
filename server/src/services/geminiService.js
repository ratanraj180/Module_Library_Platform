const { GoogleGenAI } = require('@google/genai');

/**
 * Call the official Gemini SDK to generate developer responses.
 *
 * @param {string} prompt - User message / prompt
 * @param {object} options - Generation parameters (temperature, maxOutputTokens)
 * @returns {Promise<{
 *   answer: string,
 *   model: string,
 *   latency: string,
 *   finishReason: string,
 *   usage: {
 *     promptTokens: number,
 *     completionTokens: number,
 *     totalTokens: number
 *   }
 * }>}
 */
async function generateResponse(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_KEY' || apiKey === 'invalid-key') {
    throw new Error('Gemini API key is unconfigured or invalid. Please check your environment variables.');
  }

  // Instantiate SDK with active environment key
  const ai = new GoogleGenAI({ apiKey });
  
  const model = 'gemini-2.5-flash';
  const temperature = options.temperature ?? 0.7;
  const maxOutputTokens = options.maxOutputTokens ?? 1024;

  const startTime = Date.now();
  let attempt = 0;
  let response;

  while (attempt < 2) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature,
          maxOutputTokens
        }
      });
      break; // break loop on success
    } catch (err) {
      attempt++;
      if (attempt >= 2) {
        throw new Error(`Gemini SDK Call Failed after retry: ${err.message}`);
      }
      console.warn(`[Gemini SDK Retry] Attempt ${attempt} failed. Retrying...`);
    }
  }

  const latency = ((Date.now() - startTime) / 1000).toFixed(2);
  const answer = response.text || '';

  // Get raw response metadata usage
  let promptTokens = Math.ceil(prompt.length / 4);
  let completionTokens = Math.ceil(answer.length / 4);
  let totalTokens = promptTokens + completionTokens;

  // Attempt to parse metadata if returned by response object
  if (response.usageMetadata) {
    promptTokens = response.usageMetadata.promptTokenCount || promptTokens;
    completionTokens = response.usageMetadata.candidatesTokenCount || completionTokens;
    totalTokens = response.usageMetadata.totalTokenCount || totalTokens;
  }

  const finishReason = response.candidates?.[0]?.finishReason || 'STOP';

  return {
    answer,
    model,
    latency: `${latency}s`,
    finishReason,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens
    }
  };
}

module.exports = {
  generateResponse
};