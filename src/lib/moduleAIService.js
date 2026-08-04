/**
 * moduleAIService.js
 *
 * Intent-matching recommendation engine for ModuleAI Assistant.
 * Architecture: easily replaceable with OpenAI / Gemini / Claude API
 * by swapping the `processQuery` export with an API call.
 *
 * Public API:
 *   processQuery(userText: string): Promise<AIResponse>
 *
 * AIResponse shape:
 * {
 *   intents: [{ name, confidence }],
 *   summary: string,
 *   recommendations: [Recommendation],
 *   followUps: string[]
 * }
 */

// ─── Intent Definitions ────────────────────────────────────────────────────────

const INTENTS = [
  {
    name: "Authentication",
    keywords: [
      "authentication", "auth", "login", "signin", "sign in", "sign-in",
      "logout", "jwt", "oauth", "token", "session", "register", "signup",
      "sign up", "credentials", "password", "user auth", "secure login"
    ],
    recommendations: [
      {
        name: "Login Form Component",
        type: "Component",
        description: "Polished sign-in form with email/password validation, show/hide password toggle, and error state handling.",
        installation: "npm install @modulelib/login-form",
        path: "/components/login-form",
        docsPath: "/components/login-form#documentation"
      },
      {
        name: "JWT Auth Module",
        type: "Module",
        description: "JSON Web Token generation, verification, and refresh logic. Integrates with Express middleware.",
        installation: "npm install @modulelib/jwt-auth",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Protected Route Component",
        type: "Component",
        description: "React wrapper that guards routes behind authentication checks and redirects unauthenticated users.",
        installation: "npm install @modulelib/protected-route",
        path: "/components/protected-route",
        docsPath: "/components/protected-route#documentation"
      },
      {
        name: "User Service Module",
        type: "Module",
        description: "CRUD operations for user accounts including profile management and password hashing with bcrypt.",
        installation: "npm install @modulelib/user-service",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      }
    ],
    followUps: [
      "Role Based Access Control",
      "User Profile Component",
      "Session Management Module"
    ]
  },
  {
    name: "Analytics",
    keywords: [
      "analytics", "charts", "chart", "dashboard", "reports", "report",
      "graphs", "graph", "metrics", "kpi", "statistics", "stats",
      "data visualization", "visualize", "trends", "telemetry"
    ],
    recommendations: [
      {
        name: "Chart Component",
        type: "Component",
        description: "Responsive line, bar, and pie charts built on Recharts. Light theme with gold accent colours.",
        installation: "npm install @modulelib/chart",
        path: "/components/chart",
        docsPath: "/components/chart#documentation"
      },
      {
        name: "Data Table Component",
        type: "Component",
        description: "Sortable, filterable data grids with pagination, CSV export, and column visibility toggles.",
        installation: "npm install @modulelib/data-table",
        path: "/components/data-table",
        docsPath: "/components/data-table#documentation"
      },
      {
        name: "Analytics Dashboard Module",
        type: "Module",
        description: "Pre-built backend aggregation pipelines for usage metrics, event tracking, and reporting endpoints.",
        installation: "npm install @modulelib/analytics-dashboard",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Reports Module",
        type: "Module",
        description: "Scheduled report generation in PDF and CSV formats with email delivery integration.",
        installation: "npm install @modulelib/reports",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      }
    ],
    followUps: [
      "Real-time Data Streaming",
      "Export to PDF Component",
      "Date Range Picker Component"
    ]
  },
  {
    name: "File Upload",
    keywords: [
      "upload", "file upload", "image upload", "documents", "attachments",
      "drag and drop", "drag-and-drop", "file picker", "media upload",
      "multer", "storage", "s3", "cdn"
    ],
    recommendations: [
      {
        name: "File Upload Component",
        type: "Component",
        description: "Drag-and-drop file uploader with preview thumbnails, progress bars, and file type validation.",
        installation: "npm install @modulelib/file-upload",
        path: "/components/file-upload",
        docsPath: "/components/file-upload#documentation"
      },
      {
        name: "Multer Upload Module",
        type: "Module",
        description: "Express middleware for multipart/form-data using Multer with disk and memory storage strategies.",
        installation: "npm install @modulelib/upload-middleware",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Image Preview Component",
        type: "Component",
        description: "Lightbox-style image preview with zoom, rotation, and full-screen support for uploaded media.",
        installation: "npm install @modulelib/image-preview",
        path: "/components/image-preview",
        docsPath: "/components/image-preview#documentation"
      }
    ],
    followUps: [
      "Cloud Storage Integration Module",
      "Progress Bar Component",
      "File Validator Module"
    ]
  },
  {
    name: "Chat & Realtime",
    keywords: [
      "chat", "messaging", "message", "websocket", "web socket", "socket",
      "realtime", "real time", "real-time", "notifications", "notification",
      "live updates", "push", "events", "broadcast", "pubsub"
    ],
    recommendations: [
      {
        name: "Chat Window Component",
        type: "Component",
        description: "Full-featured chat UI with message bubbles, read receipts, typing indicators, and emoji support.",
        installation: "npm install @modulelib/chat-window",
        path: "/components/chat-window",
        docsPath: "/components/chat-window#documentation"
      },
      {
        name: "Notification Component",
        type: "Component",
        description: "Toast notification system with queuing, auto-dismiss, and action button support.",
        installation: "npm install @modulelib/notification",
        path: "/components/notification",
        docsPath: "/components/notification#documentation"
      },
      {
        name: "Socket Service Module",
        type: "Module",
        description: "Socket.io server wrapper with room management, event broadcasting, and reconnection handling.",
        installation: "npm install @modulelib/socket-service",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      }
    ],
    followUps: [
      "User Presence Indicator",
      "Push Notification Module",
      "Message Queue Service"
    ]
  },
  {
    name: "Ecommerce",
    keywords: [
      "payment", "pay", "cart", "shopping cart", "orders", "order",
      "checkout", "ecommerce", "e-commerce", "e commerce", "products",
      "product", "stripe", "paypal", "invoice", "billing", "subscription"
    ],
    recommendations: [
      {
        name: "Product Card Component",
        type: "Component",
        description: "Responsive product display card with image, pricing, ratings, and add-to-cart action.",
        installation: "npm install @modulelib/product-card",
        path: "/components/product-card",
        docsPath: "/components/product-card#documentation"
      },
      {
        name: "Cart Component",
        type: "Component",
        description: "Shopping cart drawer with item management, quantity controls, and subtotal calculations.",
        installation: "npm install @modulelib/cart",
        path: "/components/cart",
        docsPath: "/components/cart#documentation"
      },
      {
        name: "Payment Gateway Module",
        type: "Module",
        description: "Stripe and PayPal integration with webhook handling, subscription management, and refund processing.",
        installation: "npm install @modulelib/payment-gateway",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Order Service Module",
        type: "Module",
        description: "Order lifecycle management including creation, status tracking, fulfillment, and notifications.",
        installation: "npm install @modulelib/order-service",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      }
    ],
    followUps: [
      "Inventory Management Module",
      "Coupon & Discount Module",
      "Order History Component"
    ]
  },
  {
    name: "Admin Panel",
    keywords: [
      "admin", "administration", "admin panel", "admin dashboard", "management",
      "back office", "backoffice", "control panel", "cms", "content management"
    ],
    recommendations: [
      {
        name: "Analytics Cards Component",
        type: "Component",
        description: "KPI metric blocks with trend indicators, sparklines, and colour-coded status badges.",
        installation: "npm install @modulelib/analytics-card",
        path: "/components/analytics-card",
        docsPath: "/components/analytics-card#documentation"
      },
      {
        name: "Sidebar Component",
        type: "Component",
        description: "Collapsible navigation sidebar with section grouping, active state, and badge support.",
        installation: "npm install @modulelib/sidebar",
        path: "/components/sidebar",
        docsPath: "/components/sidebar#documentation"
      },
      {
        name: "Role Middleware Module",
        type: "Module",
        description: "Express authorization middleware enforcing role-based route protection with fine-grained permissions.",
        installation: "npm install @modulelib/role-middleware",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      }
    ],
    followUps: [
      "User Management Table",
      "Audit Log Component",
      "Settings Panel Component"
    ]
  },
  {
    name: "Access Control",
    keywords: [
      "role", "rbac", "role based", "access control", "permissions",
      "authorization", "authorisation", "privilege", "acl", "policy",
      "user roles", "admin role", "developer role", "guard"
    ],
    recommendations: [
      {
        name: "Role Middleware Module",
        type: "Module",
        description: "Express authorization middleware enforcing role-based route protection with fine-grained permissions.",
        installation: "npm install @modulelib/role-middleware",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Protected Route Component",
        type: "Component",
        description: "React wrapper that guards routes behind authentication checks and redirects unauthenticated users.",
        installation: "npm install @modulelib/protected-route",
        path: "/components/protected-route",
        docsPath: "/components/protected-route#documentation"
      },
      {
        name: "Permission Gate Component",
        type: "Component",
        description: "Conditional render wrapper showing or hiding UI elements based on current user role and permissions.",
        installation: "npm install @modulelib/permission-gate",
        path: "/components/permission-gate",
        docsPath: "/components/permission-gate#documentation"
      }
    ],
    followUps: [
      "JWT Auth Module",
      "Audit Log Component",
      "User Service Module"
    ]
  },
  {
    name: "Live Streaming",
    keywords: [
      "stream", "streaming", "live stream", "video", "media player",
      "broadcast", "webrtc", "hls", "rtmp", "watch", "player"
    ],
    recommendations: [
      {
        name: "Video Player Component",
        type: "Component",
        description: "HLS-compatible video player with custom controls, quality switching, and fullscreen mode.",
        installation: "npm install @modulelib/video-player",
        path: "/components/video-player",
        docsPath: "/components/video-player#documentation"
      },
      {
        name: "Stream Service Module",
        type: "Module",
        description: "WebRTC and HLS server-side stream management with room creation and viewer count tracking.",
        installation: "npm install @modulelib/stream-service",
        path: "/dashboard/modules",
        docsPath: "/docs/api-reference"
      },
      {
        name: "Chat Window Component",
        type: "Component",
        description: "Live chat panel for stream viewer interaction with emoji reactions and moderation controls.",
        installation: "npm install @modulelib/chat-window",
        path: "/components/chat-window",
        docsPath: "/components/chat-window#documentation"
      }
    ],
    followUps: [
      "Viewer Count Badge Component",
      "Recording Service Module",
      "CDN Delivery Module"
    ]
  }
];

// ─── Scoring Engine ─────────────────────────────────────────────────────────────

/**
 * Score a single intent against the query.
 * Returns a score from 0 to 100.
 */
function scoreIntent(intent, query) {
  const q = query.toLowerCase();
  let matchCount = 0;
  let totalWeight = 0;

  for (const kw of intent.keywords) {
    const weight = kw.split(" ").length; // multi-word phrases score higher
    totalWeight += weight;
    if (q.includes(kw.toLowerCase())) {
      matchCount += weight;
    }
  }

  const raw = totalWeight > 0 ? matchCount / totalWeight : 0;
  // Apply a boost for exact single-word matches in the query tokens
  const tokens = q.split(/\s+/);
  const exactBoost = intent.keywords.some((kw) =>
    tokens.includes(kw.toLowerCase())
  )
    ? 0.15
    : 0;

  return Math.min(100, Math.round((raw + exactBoost) * 100));
}

// ─── Deduplication ─────────────────────────────────────────────────────────────

function dedupeRecs(recs) {
  const seen = new Set();
  return recs.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });
}

// ─── Typing Phase Simulator ─────────────────────────────────────────────────────

/**
 * Returns simulated typing phases for the UI to cycle through.
 */
export function getTypingPhases() {
  return ["Analyzing request...", "Searching registry...", "Generating recommendations..."];
}

// ─── Main Service Function ─────────────────────────────────────────────────────

/**
 * processQuery(userText)
 *
 * Replace this function body with an OpenAI / Gemini / Claude API call
 * in the future without changing any UI component that imports this module.
 *
 * @param {string} userText - Raw natural-language input from the user
 * @returns {Promise<{
 *   intents: {name: string, confidence: number}[],
 *   summary: string,
 *   recommendations: object[],
 *   followUps: string[]
 * }>}
 */
export async function processQuery(userText, sessionId = "default-session", engine = "gemini") {
  const query = (userText || "").trim();
  if (!query) {
    return {
      intents: [],
      summary: "Please specify a search query.",
      recommendations: [],
      followUps: []
    };
  }

  // Determine auth headers
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${BASE_URL}/api/ai/search?q=${encodeURIComponent(query)}&sessionId=${encodeURIComponent(sessionId)}&engine=${encodeURIComponent(engine)}`, { headers });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson?.message || `Registry search failed with status ${res.status}`);
    }
    const json = await res.json();
    return json?.data || json;
  } catch (err) {
    console.error("[ModuleAI Service] Backend integration error:", err);
    throw err; // bubble error up so the frontend displays a structured fallback state
  }
}
