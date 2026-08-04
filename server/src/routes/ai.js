const express = require('express');
const Module = require('../models/Module');
const Component = require('../models/Component');
const auth = require('../middleware/auth');
const { success, error } = require('../utils/apiResponse');
const { generateEmbedding } = require('../utils/vectorize');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Initialize Gemini for Ankit's AI Mode
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_KEY');
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ─── In-memory session conversation histories ────────────────────────────────
const conversationHistories = {};

// ─────────────────────────────────────────────────────────────────────────────
// INTENT CLASSIFIER AND KEYWORDS MAP
// ─────────────────────────────────────────────────────────────────────────────
const SUPPORTED_RAG_INTENTS = [
  'find module', 'find component', 'search module', 'search component',
  'recommend module', 'recommend component', 'need component', 'need module',
  'available modules', 'available components', 'authentication components',
  'dashboard components', 'show modules', 'install module', 'download component',
  'library search', 'registry search'
];

function classifyIntent(query) {
  const q = query.toLowerCase().trim();

  // 1. Available listing request check
  if (
    /^(what modules are available|what components are available|show everything|list available modules|list modules|list components|available modules|available components)\b/.test(q)
  ) {
    return 'available_listing_query';
  }

  // 2. Exact keyword / phrase matching against supported RAG intents
  const matchesSupportedRag = SUPPORTED_RAG_INTENTS.some(phrase => q.includes(phrase));
  
  // Also check single core RAG trigger keywords
  const hasCoreSearchKeyword = /\b(authentication|login|jwt|dashboard|upload|websocket|payment|notification|analytics|redis|cache|mongodb|component|module|recommend|install|search|stripe|auth|download|library|registry|otp|pagination|middleware|role guard|authorization|file upload)\b/.test(q);

  if (matchesSupportedRag || hasCoreSearchKeyword) {
    return 'registry_search';
  }

  // 3. GREETINGS
  if (/^(hello|hi|hey|hiya|yo|howdy|greetings|good morning|good afternoon|good evening|good night|sup|what's up|whats up|salut|namaste)\b/.test(q)) {
    return 'greeting';
  }

  // 4. GENERAL CONVERSATION (Small Talk)
  if (
    /^(how are you|how r u|how's it going|what's new|anything new|nice to meet you|thanks|thank you|ty|thx|cheers|you're welcome|no problem|cool|awesome|great|ok|okay|sure|sounds good|perfect|got it)\b/.test(q) ||
    /^(what is your name|what do you do|who made you|who created you|tell me a joke|say something funny|give me a fun fact)\b/.test(q)
  ) {
    return 'small_talk';
  }

  // 5. DOCUMENTATION QUERY
  if (
    /\b(docs?|documentation|api reference|how to use|usage guide|installation instructions|readme|manual|guide for|specification)\b/.test(q)
  ) {
    return 'documentation_query';
  }

  // 6. PROGRAMMING HELP
  if (
    /^(write|create|generate|build|code|implement|make)\b.{0,40}\b(function|class|component|hook|api|endpoint|route|schema|model|script|program|algorithm|snippet|example|code|app)\b/.test(q) ||
    /\b(write a|create a|generate a|build a|make a|code a)\b.{0,30}\b(react|vue|angular|node|express|next|function|component|hook|class|api)\b/.test(q) ||
    /\b(error|bug|fix|issue|problem|crash|exception|not working|fails?|broken|undefined|null|cannot read|typeerror|syntaxerror|referenceerror|traceback|stack trace|debug|troubleshoot)\b/.test(q)
  ) {
    return 'programming';
  }

  // 7. TECHNICAL QUESTION
  if (
    /^(what (is|are|does|do|was|were)|explain|how (does|do|did|can|should|would)|why (does|do|is|are|should)|tell me (about|how|what|why)|describe|define|elaborate|summarize|give (me |an? )?(overview|explanation|summary|example|introduction))\b/.test(q) ||
    /\b(how (to|do you|can i|do i|does one|difference between|compare|vs\.?|versus|microservice|monolith|scalab(le|ility)|best practice|folder structure|tech stack))\b/.test(q)
  ) {
    return 'technical_question';
  }

  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PERSONA PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PERSONA = `You are Module AI Assistant — an enterprise-grade AI assistant powered by Google Gemini.
You are knowledgeable, friendly, and concise. You can help with:
- Programming questions (any language or framework)
- Software architecture and design patterns
- Code generation and debugging
- Technical explanations and comparisons
- General software engineering topics

When answering, be thorough but concise. Use markdown formatting with headers, code blocks, and bullet points where appropriate.
Always answer in clear, professional English.`;

// ─────────────────────────────────────────────────────────────────────────────
// BUILD GEMINI PROMPT per intent
// ─────────────────────────────────────────────────────────────────────────────
function buildGeminiPrompt(intent, query) {
  const base = `${SYSTEM_PERSONA}\n\nUser Query: "${query}"\n\n`;

  switch (intent) {
    case 'greeting':
      return `${SYSTEM_PERSONA}\n\nThe user just greeted you with: "${query}"\n\nReply with a warm, friendly greeting. Introduce yourself briefly as Module AI Assistant. Mention that you can help with programming questions, technical explanations, and finding modules in their Module Library. Keep it short and inviting.`;

    case 'small_talk':
      return `${SYSTEM_PERSONA}\n\nThe user sent this conversational message: "${query}"\n\nReply naturally and warmly. Be personable. If they thank you, acknowledge it. If they ask about you, explain what you can do. Keep it conversational and brief.`;

    case 'technical_question':
      return `${base}Provide a thorough, accurate explanation of the technical concept. Use examples and clarify core design trade-offs.`;

    case 'programming':
      return `${base}Provide precise programming help, fix error trace exceptions, or write clean, well-commented code blocks.`;

    case 'unknown':
    default:
      return `${base}Answer this query naturally as a helpful AI assistant.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG SEMANTIC SEARCH ON MongoDB Collections
// ─────────────────────────────────────────────────────────────────────────────
const SEMANTIC_MAP = {
  'authentication': ['jwt', 'oauth', 'role guard', 'rbac', 'login', 'register', 'otp', 'password reset', 'session', 'middleware', 'authorization', 'token', 'user authentication', 'auth'],
  'auth': ['jwt', 'oauth', 'role guard', 'rbac', 'login', 'register', 'otp', 'password reset', 'session', 'middleware', 'authorization', 'token', 'user authentication', 'authentication'],
  'login': ['authentication', 'auth', 'signin', 'sign in', 'credentials', 'password'],
  'jwt': ['authentication', 'auth', 'token', 'oauth', 'session'],
  'redis': ['cache', 'caching', 'store', 'key-value', 'session'],
  'otp': ['mfa', '2fa', 'authentication', 'sms', 'email', 'one-time password'],
  'notification': ['sms', 'email', 'websocket', 'realtime', 'push', 'alert', 'toast'],
  'pagination': ['limit', 'offset', 'cursor', 'skip', 'page', 'query', 'list'],
  'upload': ['file upload', 'image upload', 'multer', 'storage', 's3', 'attachment', 'media'],
  'dashboard': ['charts', 'metrics', 'statistics', 'stats', 'kpi', 'reports', 'visualize'],
  'middleware': ['express', 'guard', 'filter', 'interceptor', 'handler', 'request', 'auth'],
  'role guard': ['rbac', 'permissions', 'access control', 'authorization', 'admin', 'developer', 'privileges'],
  'authorization': ['permissions', 'rbac', 'access control', 'role guard', 'privileges', 'authorization'],
  'mongodb': ['mongoose', 'database', 'nosql', 'query', 'schema', 'model', 'document']
};

async function runRegistrySearch(query, sessionId) {
  const { getEmbedding: embed, cosineSimilarity: cosine } = require('../utils/embeddingService');

  try {
    if (!conversationHistories[sessionId]) conversationHistories[sessionId] = [];
    
    const pastQueries = conversationHistories[sessionId]
      .filter(m => m.role === 'user').slice(-4).map(m => m.text).join(' ') || query;

    const queryVector = embed(pastQueries);

    // Parallel searches in MongoDB across approved items
    const [dbModules, dbComponents] = await Promise.all([
      Module.find({ status: 'approved' }).populate('owner', 'name email').lean(),
      Component.find({ status: 'approved' }).populate('owner', 'name email').lean()
    ]);

    const candidates = [
      ...dbModules.map(m => ({ ...m, type: 'Module' })),
      ...dbComponents.map(c => ({ ...c, type: 'Component' }))
    ];

    if (candidates.length === 0) {
      return { candidates: [], topChunks: [], groupedMatches: [], finalMatches: [], isExactMatch: false };
    }

    const lq = query.toLowerCase();
    
    // Find all semantic expansion terms to boost the search score
    const synonyms = [];
    Object.keys(SEMANTIC_MAP).forEach(keyword => {
      if (lq.includes(keyword)) {
        synonyms.push(...SEMANTIC_MAP[keyword]);
      }
    });

    const allChunks = [];
    for (const item of candidates) {
      const itemChunks = item.chunks || [];
      
      const tagsText = (item.tags || []).join(' ');
      const techText = typeof item.technology === 'string' ? item.technology : (item.technologies || []).join(' ');
      const categoryText = typeof item.category === 'string' ? item.category : (item.categories || []).join(' ');
      const keywordsText = (item.keywords || []).join(' ');
      const authorText = item.owner?.name || '';
      
      const itemBody = `${item.title} ${item.description} ${tagsText} ${techText} ${categoryText} ${keywordsText} ${authorText}`;

      if (itemChunks.length === 0) {
        allChunks.push({
          item,
          chunkTitle: 'Overview',
          chunkText: item.description,
          embedding: (item.embedding && item.embedding.length > 0) ? item.embedding : embed(itemBody)
        });
      } else {
        itemChunks.forEach(chunk => {
          const chunkBody = `${item.title} ${chunk.chunkTitle || ''} ${chunk.chunkText || chunk.text || ''} ${tagsText} ${techText}`;
          allChunks.push({
            item,
            chunkTitle: chunk.chunkTitle || 'Section',
            chunkText: chunk.chunkText || chunk.text || '',
            embedding: (chunk.embedding && chunk.embedding.length > 0) ? chunk.embedding : embed(chunkBody)
          });
        });
      }
    }

    const scored = allChunks.map(chk => {
      let score = cosine(queryVector, chk.embedding);
      
      // Exact and semantic weight expansions
      const tags = (chk.item.tags || []).map(t => t.toLowerCase());
      const keywords = (chk.item.keywords || []).map(k => k.toLowerCase());
      const title = (chk.item.title || '').toLowerCase();
      const desc = (chk.item.description || '').toLowerCase();
      const category = (chk.item.category || '').toLowerCase();
      const technology = (chk.item.technology || chk.item.technologies || []).toString().toLowerCase();
      const author = (chk.item.owner?.name || '').toLowerCase();

      // direct title matches get a huge boost
      if (title && lq.includes(title)) score += 0.40;
      
      // check synonyms matching
      synonyms.forEach(syn => {
        const terms = syn.toLowerCase();
        if (title.includes(terms)) score += 0.35;
        if (desc.includes(terms)) score += 0.20;
        if (tags.some(t => t.includes(terms))) score += 0.15;
        if (keywords.some(k => k.includes(terms))) score += 0.15;
        if (category.includes(terms)) score += 0.10;
        if (technology.includes(terms)) score += 0.10;
        if (author.includes(terms)) score += 0.08;
      });

      const popularity = Math.min(0.05, (chk.item.downloadCount || 0) * 0.0005);
      return { ...chk, score: score + popularity, rawSimilarity: score };
    });

    const topChunks = scored.filter(c => c.score > 0.05).sort((a, b) => b.score - a.score).slice(0, 10);

    const grouped = {};
    topChunks.forEach(chk => {
      const id = chk.item._id.toString();
      if (!grouped[id]) {
        grouped[id] = { item: chk.item, bestScore: chk.score, rawSimilarity: chk.rawSimilarity, matchingSections: [] };
      }
      grouped[id].matchingSections.push({ title: chk.chunkTitle, text: chk.chunkText, score: chk.score });
      if (chk.score > grouped[id].bestScore) {
        grouped[id].bestScore = chk.score;
        grouped[id].rawSimilarity = chk.rawSimilarity;
      }
    });

    const EXACT_THRESHOLD = 0.65; 
    const RELATED_THRESHOLD = 0.40; 

    const exactMatches = Object.values(grouped).filter(m => m.bestScore >= EXACT_THRESHOLD).sort((a, b) => b.bestScore - a.bestScore);
    const isExactMatch = exactMatches.length > 0;

    let finalMatches = exactMatches;
    if (!isExactMatch) {
      finalMatches = Object.values(grouped).filter(m => m.bestScore >= RELATED_THRESHOLD && m.bestScore < EXACT_THRESHOLD).sort((a, b) => b.bestScore - a.bestScore).slice(0, 3);
    }

    return { candidates, topChunks, groupedMatches: exactMatches, finalMatches, isExactMatch };
  } catch (err) {
    console.error('[ModuleAI Error] runRegistrySearch:', err);
    return { candidates: [], topChunks: [], groupedMatches: [], finalMatches: [], isExactMatch: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT RECOMMENDATION OBJECTS WITH SIMILARITY THRESHOLD LABELS (NORMALIZED)
// ─────────────────────────────────────────────────────────────────────────────
function formatRecommendations(finalMatches) {
  return finalMatches.map(m => {
    const rec = m.item;
    const isModule = rec.type === 'Module';
    const confidence = Math.min(100, Math.max(10, Math.round(m.bestScore * 100)));
    
    let matchQuality = "Weak Match";
    if (confidence >= 85) matchQuality = "Excellent Match";
    else if (confidence >= 70) matchQuality = "Related Match";

    const path = isModule ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}`;
    const docsPath = isModule ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}#documentation`;
    const installCmd = rec.installation || (isModule ? `npm install ${rec.title}` : `npm install @components/${rec.title.toLowerCase().replace(/\s+/g, '-')}`);

    return {
      // 1. Required normalized fields
      id: rec._id,
      name: rec.title,
      type: rec.type,
      description: rec.description,
      version: rec.currentVersion || '1.0.0',
      category: rec.category || (isModule ? 'Utilities' : 'UI Components'),
      technology: rec.technology || 'JavaScript',
      tags: rec.tags || [],
      installCommand: installCmd,
      documentationUrl: docsPath,
      downloads: rec.downloadCount || 0,
      rating: rec.rating || 5.0,
      publisher: rec.owner?.name || 'Platform Team',

      // 2. Compatibility fields to support existing UI props
      installation: installCmd,
      path: path,
      docsPath: docsPath,
      confidence,
      matchQuality
    };
  });
}

// ==========================================
// ANKIT'S FUZZY AND KEYWORD SEARCH HELPERS
// ==========================================
function getLevenshteinDistance(a, b) {
  const tmp = [];
  let i, j, val;
  for (i = 0; i <= a.length; i++) tmp.push([i]);
  for (j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      val = a[i - 1] === b[j - 1] ? 0 : 1;
      tmp[i][j] = Math.min(tmp[i - 1][j] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j - 1] + val);
    }
  }
  return tmp[a.length][b.length];
}

function isFuzzyMatch(word1, word2) {
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) return true;
  if (w1.length < 3 || w2.length < 3) return false;
  return getLevenshteinDistance(w1, w2) <= (w1.length > 6 ? 2 : 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE: GET /api/ai/search
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', auth.optional, async (req, res, next) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timed out.'));
    }, 15000);
  });

  const startTotalTime = Date.now();

  try {
    const query = (req.query.q || '').trim();
    const sessionId = req.query.sessionId || req.user?.id || 'default-session';
    const mode = req.query.mode || 'ai'; 

    console.log(`[Search Engine] Query: "${query}" | Mode: ${mode.toUpperCase()}`);

    if (!query) {
      clearTimeout(timeoutId);
      return res.status(400).json({ success: false, message: 'Please specify a query parameter (q).' });
    }

    const mainExecution = (async () => {
      // ─── ANKIT'S STANDARD KEYWORD SEARCH ───────────────
      if (mode === 'standard') {
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const mongoQuery = { status: 'approved' };

        if (queryWords.length > 0) {
          mongoQuery.$or = queryWords.map(word => ({
            $or: [
              { title: { $regex: word, $options: 'i' } },
              { description: { $regex: word, $options: 'i' } },
              { tags: { $regex: word, $options: 'i' } },
              { category: { $regex: word, $options: 'i' } },
              { technology: { $regex: word, $options: 'i' } }
            ]
          }));
        }

        const [dbModules, dbComponents] = await Promise.all([
          Module.find(mongoQuery).populate('owner', 'name').lean(),
          Component.find(mongoQuery).populate('owner', 'name').lean()
        ]);

        const candidates = [
          ...dbModules.map(m => ({ ...m, type: 'Module' })),
          ...dbComponents.map(c => ({ ...c, type: 'Component' }))
        ];

        const scored = candidates.map(item => {
          let score = 0;
          const title = (item.title || '').toLowerCase();
          const desc = (item.description || '').toLowerCase();
          const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []);
          
          if (title === query.toLowerCase()) score += 150;
          else if (title.includes(query.toLowerCase())) score += 80;

          queryWords.forEach(word => {
            if (title.includes(word)) score += 40;
            if (tags.some(tag => isFuzzyMatch(tag, word))) score += 30;
            if (desc.includes(word)) score += 10;
          });
          return { item, score };
        });

        const matches = scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score);
        const recommendations = matches.map(m => {
          const isMod = m.item.type === 'Module';
          const path = isMod ? `/dashboard/modules/${m.item._id}` : `/components/${m.item._id}`;
          const docsPath = isMod ? `/dashboard/modules/${m.item._id}` : `/components/${m.item._id}#documentation`;
          const installCmd = m.item.installation || (isMod ? `npm install ${m.item.title}` : `npm install @components/${m.item.title.toLowerCase().replace(/\s+/g, '-')}`);

          return {
            id: m.item._id,
            name: m.item.title,
            type: m.item.type,
            description: m.item.description,
            version: m.item.currentVersion || '1.0.0',
            category: m.item.category || (isMod ? 'Utilities' : 'UI Components'),
            technology: m.item.technology || 'JavaScript',
            tags: m.item.tags || [],
            installCommand: installCmd,
            documentationUrl: docsPath,
            downloads: m.item.downloadCount || 0,
            rating: m.item.rating || 5.0,
            publisher: m.item.owner?.name || 'Platform Team',

            installation: installCmd,
            path: path,
            docsPath: docsPath,
            confidence: Math.min(100, Math.max(10, Math.round(m.score))),
            matchQuality: "Related Match"
          };
        }).slice(0, 6);

        return {
          intent: 'registry_search',
          intents: [{ name: "Keyword Match", confidence: 100 }],
          summary: recommendations.length > 0 ? "Top keyword matches found:" : "No matches found via keyword search.",
          recommendations,
          followUps: ["Try switching to AI Mode"]
        };
      }

      // ─── ANKIT'S VECTOR SEARCH MODE ───────────
      if (mode === 'vector') {
        const queryVector = await generateEmbedding(query);

        const buildVectorPipeline = (isModule) => [
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: queryVector,
              numCandidates: 20,
              limit: 5
            }
          },
          { $match: { status: 'approved' } },
          {
            $project: {
              score: { $meta: 'vectorSearchScore' },
              title: 1, description: 1, category: 1, tags: 1, installation: 1, _id: 1,
              type: { $literal: isModule ? 'Module' : 'Component' }
            }
          }
        ];

        const [dbModules, dbComponents] = await Promise.all([
          Module.aggregate(buildVectorPipeline(true)),
          Component.aggregate(buildVectorPipeline(false))
        ]);
        
        const allResults = [...dbModules, ...dbComponents].sort((a, b) => b.score - a.score);

        const highConfidence = allResults.filter(r => r.score * 100 >= 60);
        const lowConfidence = allResults.filter(r => r.score * 100 < 60).slice(0, 3);

        const registryContext = highConfidence.length > 0 
          ? highConfidence.map(r => `Asset: ${r.title}\nDescription: ${r.description}`).join('\n\n')
          : "No direct matches found.";

        const nearMisses = lowConfidence.length > 0 
          ? `However, I found these related items: ${lowConfidence.map(r => r.title).join(', ')}`
          : "I found no related items.";

        const geminiPrompt = `
          You are a Senior Software Architect. User query: "${query}"
          
          Direct matches: ${registryContext}
          Contextual near-misses: ${nearMisses}

          INSTRUCTIONS:
          - If matches exist, provide TECHNICAL VERDICT and COMPARATIVE ANALYSIS.
          - If NO matches exist, use near-misses to suggest what the user should look for instead.
          - NEVER invent a component that does not exist.
        `;

        const result = await geminiModel.generateContent(geminiPrompt);
        const summary = result.response.text().trim();
        const recommendations = highConfidence.map(rec => {
          const isMod = rec.type === 'Module';
          const path = isMod ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}`;
          const docsPath = isMod ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}#documentation`;
          const installCmd = rec.installation || (isMod ? `npm install ${rec.title}` : `npm install @components/${rec.title.toLowerCase().replace(/\s+/g, '-')}`);

          return {
            id: rec._id,
            name: rec.title,
            type: rec.type,
            description: rec.description,
            version: rec.currentVersion || '1.0.0',
            category: rec.category || (isMod ? 'Utilities' : 'UI Components'),
            technology: rec.technology || 'JavaScript',
            tags: rec.tags || [],
            installCommand: installCmd,
            documentationUrl: docsPath,
            downloads: rec.downloadCount || 0,
            rating: rec.rating || 5.0,
            publisher: rec.owner?.name || 'Platform Team',

            installation: installCmd,
            path: path,
            docsPath: docsPath,
            confidence: Math.round(rec.score * 100),
            matchQuality: "Excellent Match"
          };
        });

        return {
          intent: 'registry_search',
          intents: highConfidence.slice(0, 2).map(r => ({ name: r.title, confidence: Math.round(r.score * 100) })),
          summary,
          recommendations,
          followUps: ["Publish new component", "Try broader search"]
        };
      }

      // ─── RATAN'S AI MODE / HYBRID RAG (DEFAULT) ───────────────
      const intent = classifyIntent(query);

      if (!conversationHistories[sessionId]) {
        conversationHistories[sessionId] = [];
      }

      const hasGeminiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_KEY' && process.env.GEMINI_API_KEY !== 'invalid-key');
      
      let generateGeminiResponse = null;
      if (hasGeminiKey) {
        try {
          generateGeminiResponse = require('../services/geminiService').generateResponse;
        } catch (e) {
          generateGeminiResponse = null;
        }
      }

      // FLOW A: "What modules are available?" (FETCH EVERYTHING)
      if (intent === 'available_listing_query') {
        const mongoStart = Date.now();
        const [dbModules, dbComponents] = await Promise.all([
          Module.find({ status: 'approved' }).populate('owner', 'name email').lean(),
          Component.find({ status: 'approved' }).populate('owner', 'name email').lean()
        ]);
        const mongoEnd = Date.now();

        const allItems = [
          ...dbModules.map(m => ({ ...m, type: 'Module' })),
          ...dbComponents.map(c => ({ ...c, type: 'Component' }))
        ];

        const recommendations = allItems.map(rec => {
          const isModule = rec.type === 'Module';
          const path = isModule ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}`;
          const docsPath = isModule ? `/dashboard/modules/${rec._id}` : `/components/${rec._id}#documentation`;
          const installCmd = rec.installation || (isModule ? `npm install ${rec.title}` : `npm install @components/${rec.title.toLowerCase().replace(/\s+/g, '-')}`);

          return {
            id: rec._id,
            name: rec.title,
            type: rec.type,
            description: rec.description,
            version: rec.currentVersion || '1.0.0',
            category: rec.category || (isModule ? 'Utilities' : 'UI Components'),
            technology: rec.technology || 'JavaScript',
            tags: rec.tags || [],
            installCommand: installCmd,
            documentationUrl: docsPath,
            downloads: rec.downloadCount || 0,
            rating: rec.rating || 5.0,
            publisher: rec.owner?.name || 'Platform Team',

            installation: installCmd,
            path: path,
            docsPath: docsPath,
            confidence: 100,
            matchQuality: "Excellent Match"
          };
        });

        const categories = {};
        allItems.forEach(item => {
          const cat = item.category || 'General';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(item.title);
        });

        let summary = "Here are the modules and components currently available in your Module Library:\n\n";
        Object.keys(categories).forEach(cat => {
          summary += `### 📁 ${cat}\n` + categories[cat].map(title => `- ${title}`).join('\n') + '\n\n';
        });

        const finalTotalTime = parseFloat(((Date.now() - startTotalTime) / 1000).toFixed(2));

        console.log(`[RAG Search Log]
- Detected Intent: available_listing_query
- Pipeline Mode: Hybrid RAG
- Collections Searched: components, modules
- Mongo Query: { status: 'approved' }
- Documents Retrieved: ${allItems.length}
- Similarity Score: N/A (100% Listing)
- Retrieved Context Size: ${summary.length} characters
- Gemini Prompt Size: 0 (Bypassed)
- Gemini Response Time: 0s
- Final Response Time: ${finalTotalTime}s
- Normalized Result: [Count: ${recommendations.length} items]
`);

        return {
          intent: 'registry_search',
          isExactMatch: true,
          intents: [{ name: 'AVAILABLE LISTING', confidence: 100 }],
          summary,
          recommendations,
          followUps: ['I need authentication', 'Suggest dashboard components'],
          metadata: {
            promptTokens: 0,
            completionTokens: 0,
            tokensUsed: 0,
            responseTime: finalTotalTime,
            retrievedCount: allItems.length,
            ragUsed: true,
            isExactMatch: true
          }
        };
      }

      // Check if this intent needs to trigger the local database RAG search pipeline
      const isRegistryQuery = ['registry_search', 'documentation_query', 'recommendation_request'].includes(intent);

      // FLOW B: ROUTE NON-REGISTRY intents straight to Gemini
      if (!isRegistryQuery) {
        let responseText = '';
        let promptTokens = 0;
        let completionTokens = 0;
        let isFallbackActive = false;
        const geminiStart = Date.now();

        conversationHistories[sessionId].push({ role: 'user', text: query });

        if (hasGeminiKey && generateGeminiResponse) {
          try {
            const prompt = buildGeminiPrompt(intent, query);
            const history = conversationHistories[sessionId].slice(0, -1);
            const geminiRes = await generateGeminiResponse(prompt, history);
            responseText = geminiRes.answer;
            promptTokens = Math.ceil(prompt.length / 4);
            completionTokens = Math.ceil(responseText.length / 4);
          } catch (err) {
            console.warn('[ModuleAI] Gemini call failed, falling back to local database search logic.');
            isFallbackActive = true;
          }
        } else {
          isFallbackActive = true;
        }

        const geminiEnd = Date.now();
        const geminiTime = parseFloat(((geminiEnd - geminiStart) / 1000).toFixed(2));

        if (isFallbackActive) {
          console.log('[ModuleAI] Falling back to Semantic Local Search...');
          const localRegistryResult = await runRegistrySearch(query, sessionId);
          const localRecs = formatRecommendations(localRegistryResult.finalMatches);
          const responseTime = parseFloat(((Date.now() - startTotalTime) / 1000).toFixed(2));
          
          let summary = "AI responses are temporarily unavailable. I'm searching your Module Library instead.";
          if (localRecs.length > 0) {
            summary += `\n\nBased on your query, here are the most relevant matches found directly in the Module Library:`;
          } else {
            summary += `\n\nI couldn't find a relevant module or component in your current Module Library matching "${query}".`;
          }

          conversationHistories[sessionId].push({ role: 'assistant', text: summary });

          return {
            intent: 'registry_search',
            intents: localRecs.slice(0, 2).map(r => ({ name: `${r.name} (${r.type})`, confidence: r.confidence })),
            summary,
            recommendations: localRecs,
            followUps: getFollowUps('registry_search', localRecs),
            metadata: {
              promptTokens: 0,
              completionTokens: 0,
              tokensUsed: 0,
              responseTime,
              retrievedCount: localRegistryResult.topChunks?.length || 0,
              ragUsed: true,
              isFallback: true
            }
          };
        }

        conversationHistories[sessionId].push({ role: 'assistant', text: responseText });
        const finalTotalTime = parseFloat(((Date.now() - startTotalTime) / 1000).toFixed(2));

        console.log(`[RAG Search Log]
- Detected Intent: ${intent}
- Pipeline Mode: Gemini Only
- Collections Searched: none
- Mongo Query: none
- Documents Retrieved: 0
- Similarity Score: N/A
- Retrieved Context Size: 0
- Gemini Prompt Size: ${promptTokens * 4} characters
- Gemini Response Time: ${geminiTime}s
- Final Response Time: ${finalTotalTime}s
`);

        return {
          intent,
          intents: [{ name: intent.toUpperCase().replace('_', ' '), confidence: 99 }],
          summary: responseText,
          recommendations: [],
          followUps: getFollowUps(intent),
          metadata: {
            promptTokens,
            completionTokens,
            tokensUsed: promptTokens + completionTokens,
            responseTime: finalTotalTime,
            retrievedCount: 0,
            ragUsed: false
          }
        };
      }

      // FLOW C: REGISTRY SEARCH WITH HYBRID RAG
      console.log('[ModuleAI] Activating Hybrid RAG pipeline...');
      const mongoStart = Date.now();
      const registryResult = await runRegistrySearch(query, sessionId);
      const mongoEnd = Date.now();
      const mongoTime = parseFloat(((mongoEnd - mongoStart) / 1000).toFixed(2));

      const { finalMatches, isExactMatch } = registryResult;
      const recommendations = formatRecommendations(finalMatches);

      let summary = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let isFallbackActive = false;
      const geminiStart = Date.now();

      if (hasGeminiKey && generateGeminiResponse) {
        try {
          let contextBlock = '';
          if (recommendations.length > 0) {
            contextBlock = recommendations.map((r, i) => {
              const m = finalMatches[i];
              const sections = m?.matchingSections?.map(s => `  - ${s.title}: ${s.text?.substring(0, 200)}`).join('\n') || '';
              return `**${r.name}** (${r.type}, ${r.confidence}% match)\n- Description: ${r.description}\n- Install: \`${r.installation}\`\n${sections}`;
            }).join('\n\n---\n\n');
          }

          const ragPrompt = isExactMatch && recommendations.length > 0
            ? `${SYSTEM_PERSONA}

The user asked: "${query}"

You have retrieved the following matching modules/components from the Module Library:

${contextBlock}

Your task:
1. Provide a comprehensive technical explanation of the solution — explain the concept, how it works, best practices, and implementation ideas.
2. Then write exactly this separator on its own line: %%REGISTRY_SEPARATOR%%
3. Do NOT mention the registry items by name in your explanation.`
            : `${SYSTEM_PERSONA}

The user asked: "${query}"

No exact matching modules were found in the Module Library. Explain the general programming guidelines for their request. Finally write: %%REGISTRY_SEPARATOR%%`;

          const history = conversationHistories[sessionId]
            ? conversationHistories[sessionId].filter(m => m.role !== 'user' || m.text !== query).slice(-6)
            : [];

          const geminiRes = await generateGeminiResponse(ragPrompt, history);
          const rawAnswer = geminiRes.answer || '';
          promptTokens = Math.ceil(ragPrompt.length / 4);
          completionTokens = Math.ceil(rawAnswer.length / 4);

          const parts = rawAnswer.split('%%REGISTRY_SEPARATOR%%');
          summary = parts[0].trim();
        } catch (err) {
          isFallbackActive = true;
        }
      } else {
        isFallbackActive = true;
      }

      const geminiEnd = Date.now();
      const geminiTime = parseFloat(((geminiEnd - geminiStart) / 1000).toFixed(2));

      if (isFallbackActive) {
        summary = "AI responses are temporarily unavailable. I'm searching your Module Library instead.";
        if (recommendations.length > 0) {
          summary += `\n\nBased on your query, here are the most relevant matches found directly in the Module Library:`;
        } else {
          summary += `\n\nI couldn't find a relevant module or component in your current Module Library matching "${query}".`;
        }
      }

      if (!conversationHistories[sessionId]) conversationHistories[sessionId] = [];
      conversationHistories[sessionId].push({ role: 'assistant', text: summary });

      const finalTotalTime = parseFloat(((Date.now() - startTotalTime) / 1000).toFixed(2));

      const topScores = finalMatches.map(m => `${m.item.title}: ${(m.bestScore * 100).toFixed(1)}%`).join(', ') || 'None';
      console.log(`[RAG Search Log]
- Detected Intent: ${intent}
- Pipeline Mode: Hybrid RAG
- Collections Searched: components, modules
- Mongo Query: { status: 'approved' } (tags, tech, title matching)
- Documents Retrieved: ${registryResult.candidates?.length || 0}
- Similarity Score: ${topScores}
- Retrieved Context Size: ${recommendations.length} items
- Gemini Prompt Size: ${promptTokens * 4} characters
- Gemini Response Time: ${geminiTime}s
- Final Response Time: ${finalTotalTime}s
- Normalized Result: [Count: ${recommendations.length} items]
`);

      return {
        intent: 'registry_search',
        isExactMatch,
        intents: recommendations.slice(0, 2).map(r => ({ name: `${r.name} (${r.type})`, confidence: r.confidence })),
        summary,
        recommendations,
        followUps: getFollowUps('registry_search', recommendations),
        metadata: {
          promptTokens,
          completionTokens,
          tokensUsed: promptTokens + completionTokens,
          responseTime: finalTotalTime,
          retrievedCount: registryResult.topChunks?.length || 0,
          ragUsed: true,
          isExactMatch,
          isFallback: isFallbackActive
        }
      };
    })();

    const result = await Promise.race([mainExecution, timeoutPromise]);
    clearTimeout(timeoutId);
    return success(res, result);

  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[ModuleAI Error] Global handler:', err);
    return success(res, {
      intent: 'registry_search',
      summary: "AI responses are temporarily unavailable. I'm searching your Module Library instead.\n\nI couldn't find a relevant module or component in your current Module Library.",
      recommendations: [],
      followUps: ['I need authentication', 'Suggest dashboard components'],
      metadata: { promptTokens: 0, completionTokens: 0, tokensUsed: 0, responseTime: 0.5, retrievedCount: 0, ragUsed: false, isFallback: true }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW-UP SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────
function getFollowUps(intent, recommendations = []) {
  const map = {
    greeting: ['What can you help me with?', 'Show me available modules', 'Explain JWT authentication', 'I need a payment module'],
    small_talk: ['What modules are available?', 'Help me with authentication', 'Explain React hooks'],
    clarification: ['I need a web app with React', 'I\'m building a Node.js API', 'I need authentication for my app'],
    code_generation: ['Explain how this works', 'How do I test this code?', 'What are the best practices?'],
    debugging: ['How can I prevent this error?', 'Show me best practices', 'Explain this concept'],
    architecture: ['What tech stack should I use?', 'How do I structure my project?', 'Show me code examples'],
    comparison: ['Which should I use for my project?', 'Show me code examples', 'What are the best practices?'],
    programming: ['Give me a code example', 'What are best practices?', 'How do I implement this?'],
    general_knowledge: ['Give me a code example', 'Explain more', 'What are the alternatives?'],
    registry_search: recommendations.length > 0
      ? [`Tell me about ${recommendations[0]?.name}`, 'Show related modules', 'How do I install this?', 'What other modules are available?']
      : ['What modules are available?', 'I need authentication', 'Create a Feature Request', 'Search for components']
  };
  return map[intent] || map.general_knowledge;
}

module.exports = router;
