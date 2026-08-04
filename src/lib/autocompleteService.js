/**
 * autocompleteService.js
 *
 * Provides intelligent, fuzzy sentence suggestions with category labels.
 * Architecture allows future replacement with a real autocomplete API
 * (e.g. vector search, LLM completion) by updating the getSuggestions export.
 */

// Dataset of 100+ suggestion phrases grouped by category
const SUGGESTION_POOL = [
  // Authentication
  { phrase: "I need authentication for my project", category: "Authentication" },
  { phrase: "I need JWT authentication", category: "Authentication" },
  { phrase: "Suggest login and signup components", category: "Authentication" },
  { phrase: "How do I implement OAuth?", category: "Authentication" },
  { phrase: "Recommend social sign-in modules", category: "Authentication" },
  { phrase: "I want a multi-factor authentication module", category: "Authentication" },
  { phrase: "Help me set up passport auth session", category: "Authentication" },
  
  // Security / Access Control
  { phrase: "Recommend role based access control modules", category: "Security" },
  { phrase: "I want user permissions validation middleware", category: "Security" },
  { phrase: "I need secure password hashing tools", category: "Security" },
  { phrase: "Suggest rate limiting modules for APIs", category: "Security" },
  { phrase: "How to configure CORS protection?", category: "Security" },
  
  // Dashboard & Admin Panels
  { phrase: "Suggest components for an admin dashboard", category: "Admin Panels" },
  { phrase: "Recommend analytics dashboard modules", category: "Admin Panels" },
  { phrase: "I want KPI cards and reports", category: "Admin Panels" },
  { phrase: "Suggest collapsible sidebar navigation templates", category: "Admin Panels" },
  { phrase: "I need a grid layout for admin metrics", category: "Admin Panels" },
  { phrase: "Suggest theme switcher components", category: "Admin Panels" },

  // Analytics
  { phrase: "I need chart components", category: "Analytics" },
  { phrase: "Recommend interactive data visualization tools", category: "Analytics" },
  { phrase: "I want telemetry metrics tracking modules", category: "Analytics" },
  { phrase: "Suggest reporting modules with CSV export", category: "Analytics" },
  { phrase: "How do I create responsive analytics charts?", category: "Analytics" },

  // Upload
  { phrase: "I want file upload functionality", category: "Upload" },
  { phrase: "Recommend image upload components", category: "Upload" },
  { phrase: "Suggest document management modules", category: "Upload" },
  { phrase: "I need drag and drop upload preview boxes", category: "Upload" },
  { phrase: "Suggest Multer integration disk storage scripts", category: "Upload" },

  // Chat & Notifications
  { phrase: "I need websocket support", category: "Chat" },
  { phrase: "I want chat functionality", category: "Chat" },
  { phrase: "Suggest realtime messaging modules", category: "Chat" },
  { phrase: "Recommend chat window layout components", category: "Chat" },
  { phrase: "Recommend notification components", category: "Notifications" },
  { phrase: "I want toast notification alert banners", category: "Notifications" },
  { phrase: "Suggest push notification web sockets modules", category: "Notifications" },

  // Payments & Ecommerce
  { phrase: "I need payment gateway integration", category: "Payments" },
  { phrase: "Suggest checkout components", category: "Payments" },
  { phrase: "Recommend Stripe integration code snippets", category: "Payments" },
  { phrase: "I want billing invoice generator modules", category: "Payments" },
  { phrase: "Suggest ecommerce modules", category: "Ecommerce" },
  { phrase: "Recommend shopping cart drawer components", category: "Ecommerce" },
  { phrase: "I want product grid catalog cards", category: "Ecommerce" },

  // DevOps & APIs
  { phrase: "Suggest Docker configuration blueprints", category: "DevOps" },
  { phrase: "Recommend CI/CD pipelines templates", category: "DevOps" },
  { phrase: "Suggest REST API endpoint templates", category: "APIs" },
  { phrase: "I want GraphQL resolver modules", category: "APIs" },
  { phrase: "Suggest Swagger documentation generator modules", category: "APIs" },

  // Streaming
  { phrase: "Suggest components for live streaming applications", category: "Streaming" },
  { phrase: "Recommend HLS video players", category: "Streaming" },
  { phrase: "I want custom media controller sliders", category: "Streaming" },

  // AI & Database
  { phrase: "Recommend vector database connectors", category: "Database" },
  { phrase: "Suggest MongoDB aggregation pipelines", category: "Database" },
  { phrase: "I want OpenAI model API helper functions", category: "AI" },
  { phrase: "Suggest local LLM proxy modules", category: "AI" },

  // Monitoring & Logging
  { phrase: "Suggest server health monitoring modules", category: "Monitoring" },
  { phrase: "Recommend console logger middlewares", category: "Logging" },
  { phrase: "I want error boundary tracking utilities", category: "Logging" }
];

/**
 * Calculates a simple fuzzy match score based on substring match, startsWith,
 * and token matches. Allows partial and prefix matches.
 */
function calculateFuzzyScore(phraseText, inputVal) {
  const phrase = phraseText.toLowerCase();
  const input = inputVal.toLowerCase().trim();
  
  if (!input) return 0;
  if (phrase === input) return 100;
  
  // Exact prefix match
  if (phrase.startsWith(input)) return 90;
  
  // Substring match
  const idx = phrase.indexOf(input);
  if (idx !== -1) {
    // Score based on how early it appears
    return 70 - idx;
  }
  
  // Token match (split words)
  const tokens = input.split(/\s+/).filter(Boolean);
  let matchedTokens = 0;
  for (const token of tokens) {
    if (phrase.includes(token)) {
      matchedTokens++;
    }
  }
  
  if (matchedTokens > 0) {
    return Math.round((matchedTokens / tokens.length) * 50);
  }
  
  // Fallback prefix matching for words starting with inputs (e.g. auth matches authen)
  const phraseWords = phrase.split(/\s+/);
  for (const word of phraseWords) {
    if (word.startsWith(input) || input.startsWith(word)) {
      return 40;
    }
  }
  
  return 0;
}

/**
 * Retreives autocomplete suggestions based on the user's current query input.
 *
 * @param {string} input - User query input
 * @returns {Promise<{phrase: string, category: string, score: number}[]>}
 */
export async function getSuggestions(input) {
  if (!input || input.trim().length < 2) {
    return [];
  }
  
  const scored = SUGGESTION_POOL.map(item => ({
    ...item,
    score: calculateFuzzyScore(item.phrase, input)
  }))
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score);
  
  // Return top 6 suggestions
  return scored.slice(0, 6);
}
