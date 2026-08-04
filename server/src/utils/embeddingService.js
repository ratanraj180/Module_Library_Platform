/**
 * embeddingService.js
 *
 * Lightweight local embedding utility.
 * Generates vector representations of text segments.
 * Design is easily replaceable with OpenAI / Gemini / Sentence Transformers.
 */

// Simple hashing-based vector generator for demo purposes
function getEmbedding(text) {
  const size = 384; // Typical size for lightweight Sentence Transformers (e.g. all-MiniLM-L6-v2)
  const vector = new Array(size).fill(0);
  if (!text) return vector;

  const normalized = text.toLowerCase().trim();
  
  // Basic deterministic hash projection to generate a mock embedding
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (charCode * (i + 1)) % size;
    vector[index] = (vector[index] + Math.sin(charCode + i)) / 2;
  }

  // Normalize the vector (L2 norm)
  let sumOfSquares = 0;
  for (let i = 0; i < size; i++) {
    sumOfSquares += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumOfSquares) || 1;
  for (let i = 0; i < size; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// Chunks a long markdown/text string into structured sections (e.g. Installation, Usage, API, etc.)
function getLogicalChunks(text) {
  if (!text) return [];
  const lines = text.split(/\n+/);
  const rawChunks = [];
  let currentChunk = "";
  let currentTitle = "Overview";
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (line.startsWith("#") || trimmed.toUpperCase().startsWith("INSTALLATION") || trimmed.toUpperCase().startsWith("USAGE") || trimmed.toUpperCase().startsWith("CONFIGURATION") || trimmed.toUpperCase().startsWith("API REFERENCE")) {
      if (currentChunk.trim()) {
        rawChunks.push({ title: currentTitle, text: currentChunk.trim() });
      }
      currentTitle = line.replace(/^[#\s*_-]+/g, "").trim() || "Overview";
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }
  if (currentChunk.trim()) {
    rawChunks.push({ title: currentTitle, text: currentChunk.trim() });
  }

  // If no logical headings/sections were found, chunk by word limits
  if (rawChunks.length === 0) {
    const words = text.split(/\s+/);
    const wordLimit = 100;
    let index = 1;
    for (let i = 0; i < words.length; i += wordLimit) {
      const chunkText = words.slice(i, i + wordLimit).join(" ");
      rawChunks.push({ title: `Section ${index++}`, text: chunkText });
    }
  }

  return rawChunks.filter(c => c.text.length > 5);
}

module.exports = {
  getEmbedding,
  cosineSimilarity,
  getLogicalChunks
};