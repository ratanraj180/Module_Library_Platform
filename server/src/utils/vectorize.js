const { pipeline } = require('@xenova/transformers');

class PipelineSingleton {
  static task = 'feature-extraction';
  // We use the Xenova port of the exact model we discussed
  static model = 'Xenova/all-MiniLM-L6-v2'; 
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log('[Vector AI] Loading embedding model into memory...');
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

/**
 * Converts a text string into a 384-dimensional mathematical vector.
 * @param {string} text - The component description/title to vectorize
 * @returns {Promise<number[]>} - Array of 384 numbers
 */
async function generateEmbedding(text) {
  try {
    // 1. Get the model (loads instantly if already in memory)
    const extractor = await PipelineSingleton.getInstance();
    
    // 2. Generate the math. 
    // pooling: 'mean' averages the words. normalize: true is required for Cosine Similarity search.
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // 3. Convert the Float32Array to a standard JavaScript Array for MongoDB
    return Array.from(output.data);
  } catch (error) {
    console.error('[Vector AI] Embedding generation failed:', error);
    throw error;
  }
}

module.exports = { generateEmbedding };