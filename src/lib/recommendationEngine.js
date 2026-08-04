/**
 * Recommendation Engine.
 * Implements rule-based keyword matching to discover modules and components.
 * Easily replace or extend these mappings to connect to vector search or LLMs.
 */

export function getRecommendations(query) {
  const q = query.toLowerCase();

  if (q.includes("authentication")) {
    return {
      text: "Recommended authentication elements found:",
      recs: [
        {
          name: "JWT Module",
          category: "Module",
          description: "JSON Web Token validation core library.",
          path: "/dashboard/modules/jwt-auth",
          installation: "npm install @modulelib/jwt-auth"
        },
        {
          name: "Login Component",
          category: "Component",
          description: "Clean credentials sign-in form with visibility toggle handlers.",
          path: "/components/login-form",
          installation: "npm install @modulelib/login-form"
        },
        {
          name: "Role Middleware",
          category: "Module",
          description: "Authorization validation logic wrapper guarding Express controllers.",
          path: "/dashboard/modules/role-middleware",
          installation: "npm install @modulelib/role-middleware"
        }
      ]
    };
  }

  if (q.includes("dashboard")) {
    return {
      text: "Recommended dashboard layouts configured:",
      recs: [
        {
          name: "Analytics Cards",
          category: "Component",
          description: "Responsive KPI blocks rendering progress statistics indicators.",
          path: "/components/analytics-card",
          installation: "npm install @modulelib/analytics-card"
        },
        {
          name: "Chart Component",
          category: "Component",
          description: "Visual line/bar graphs populated using local telemetries.",
          path: "/components/chart",
          installation: "npm install @modulelib/chart"
        },
        {
          name: "Sidebar Component",
          category: "Component",
          description: "Collapsible vertical navigation section with route highlights.",
          path: "/components/sidebar",
          installation: "npm install @modulelib/sidebar"
        }
      ]
    };
  }

  if (q.includes("upload")) {
    return {
      text: "Recommended upload packages found:",
      recs: [
        {
          name: "File Upload Middleware",
          category: "Module",
          description: "Multer disk storage configurations verifying files metadata.",
          path: "/dashboard/modules/upload-middleware",
          installation: "npm install @modulelib/upload-middleware"
        },
        {
          name: "Upload Component",
          category: "Component",
          description: "Sleek drag-and-drop file selector container panel.",
          path: "/components/file-upload",
          installation: "npm install @modulelib/file-upload"
        }
      ]
    };
  }

  if (q.includes("analytics")) {
    return {
      text: "Recommended analytics tools retrieved:",
      recs: [
        {
          name: "Charts",
          category: "Component",
          description: "Telemetry trend visualizations configured in light theme details.",
          path: "/components/chart",
          installation: "npm install @modulelib/chart"
        },
        {
          name: "Reports Module",
          category: "Module",
          description: "Audit logger recording events logs and data tables summaries.",
          path: "/dashboard/modules/audit-logger",
          installation: "npm install @modulelib/audit-logger"
        },
        {
          name: "Data Table",
          category: "Component",
          description: "Flexible grids structuring search sorting and category badges.",
          path: "/components/data-table",
          installation: "npm install @modulelib/data-table"
        }
      ]
    };
  }

  // Default Fallback
  return {
    text: `I analyzed your query: "${query}". Try asking me about "authentication", "dashboard", "upload", or "analytics".`,
    recs: []
  };
}
