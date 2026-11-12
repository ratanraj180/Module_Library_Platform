<div align="center">

# 🏗️ ModuleLib — Enterprise Module Library Platform

**A full-stack, AI-powered module and component registry for modern engineering teams.**

[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-8.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Firebase_Auth-11.x-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

[Live Demo](https://module-library-lake.vercel.app) · [Report Bug](https://github.com/ratanraj180/Module_Library_Platform/issues) · [Request Feature](https://github.com/ratanraj180/Module_Library_Platform/issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [AI Features](#-ai-features)
- [Authentication Flow](#-authentication-flow)
- [Module Publishing Workflow](#-module-publishing-workflow)
- [Admin Review Workflow](#-admin-review-workflow)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)
- [License](#-license)

---

## 🎯 About the Project

**ModuleLib** is an enterprise-grade platform for publishing, discovering, and managing reusable software modules and components. It features an AI-powered semantic search assistant (RAG pipeline), role-based access control, admin approval workflows, automated security scanning, and a rich analytics dashboard — built to simulate a real-world internal developer platform used by engineering teams.

---

## 🌐 Live Demo

| Service   | URL                                                                 |
|-----------|---------------------------------------------------------------------|
| Frontend  | [module-library-lake.vercel.app](https://module-library-lake.vercel.app) |
| Backend   | [module-library.onrender.com](https://module-library.onrender.com)       |

> **Note:** The Render free-tier backend may take ~30 seconds to cold-start on the first request.

---

## ✨ Features

| Category               | Feature                                                       |
|------------------------|---------------------------------------------------------------|
| 🤖 **AI Assistant**    | Gemini 2.5 Flash–powered conversational AI with hybrid RAG    |
| 🔍 **Smart Search**    | Semantic vector search + keyword search + fuzzy matching       |
| 📦 **Module Registry** | Publish, version, download, and manage reusable modules        |
| 🧩 **Components**      | Publish reusable UI/backend components with live previews      |
| 🔐 **Authentication**  | Google Sign-In, Email/Password, Firebase Auth + JWT            |
| 🛡️ **Security**       | Automated vulnerability scanning and security reports          |
| 👑 **Admin Panel**     | Approval queue, component reviews, and role-based access       |
| 📊 **Analytics**       | Real-time dashboards with download metrics and category stats  |
| 👥 **Teams**           | Team management, member invitations, and collaboration         |
| 📝 **Reviews**         | Community ratings and review system for modules                |
| 🔄 **Version Control** | Semantic versioning with changelog tracking                    |
| 🌙 **Premium UI**      | Gold-accent design system with micro-animations                |

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Purpose                          |
|------------------|----------------------------------|
| React 19         | UI library                       |
| Vite 8           | Build tool and dev server        |
| Tailwind CSS 4   | Utility-first styling            |
| React Router 7   | Client-side routing              |
| Lucide React     | Icon library                     |
| Firebase SDK 11  | Authentication (Google + Email)  |

### Backend

| Technology       | Purpose                          |
|------------------|----------------------------------|
| Node.js 22       | Runtime environment              |
| Express 5        | Web framework                    |
| MongoDB Atlas    | Cloud database                   |
| Mongoose 9       | ODM and schema validation        |
| JWT              | Stateless authentication tokens  |
| Multer           | File upload handling             |
| Helmet           | HTTP security headers            |
| bcryptjs         | Password hashing                 |

### AI & Search

| Technology            | Purpose                                   |
|-----------------------|-------------------------------------------|
| Google Gemini 2.5     | Conversational AI and content generation  |
| Custom RAG Pipeline   | Retrieval-Augmented Generation            |
| Vector Embeddings     | Semantic similarity search                |
| Cosine Similarity     | Relevance scoring                         |
| Levenshtein Distance  | Fuzzy text matching                       |

### DevOps & Deployment

| Service       | Purpose                  |
|---------------|--------------------------|
| Vercel        | Frontend hosting (CDN)   |
| Render        | Backend hosting          |
| MongoDB Atlas | Managed cloud database   |
| Firebase      | Authentication provider  |
| GitHub        | Version control and CI   |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                    │
│                        Deployed on Vercel                       │
├──────────┬──────────────────────────────────────┬───────────────┤
│  Firebase│        REST API Requests             │  Firebase     │
│  Auth SDK│        (VITE_API_BASE_URL)           │  Google       │
│          │                                      │  Sign-In      │
└────┬─────┴──────────────┬───────────────────────┴───────┬───────┘
     │                    │                               │
     ▼                    ▼                               ▼
┌─────────┐    ┌─────────────────────┐          ┌─────────────────┐
│ Firebase│    │   EXPRESS SERVER    │          │   Firebase      │
│ Auth    │    │   Deployed on      │          │   Console       │
│ Service │    │   Render           │          │   (Auth Users)  │
└─────────┘    ├─────────────────────┤          └─────────────────┘
               │  ┌───────────────┐  │
               │  │   Middleware  │  │
               │  │ ─ CORS       │  │
               │  │ ─ Helmet     │  │
               │  │ ─ JWT Auth   │  │
               │  │ ─ Multer     │  │
               │  └───────┬───────┘  │
               │          │          │
               │  ┌───────▼───────┐  │
               │  │    Routes     │  │
               │  │ /api/auth     │  │
               │  │ /api/modules  │  │
               │  │ /api/components│ │
               │  │ /api/ai       │  │
               │  │ /api/reviews  │  │
               │  │ /api/security │  │
               │  │ /api/users    │  │
               │  └───────┬───────┘  │
               │          │          │
               │  ┌───────▼───────┐  │
               │  │  Controllers  │  │
               │  │  + Services   │  │
               │  │  + Gemini AI  │  │
               │  │  + RAG Engine │  │
               │  └───────┬───────┘  │
               └──────────┼──────────┘
                          │
                          ▼
               ┌─────────────────────┐
               │   MongoDB Atlas     │
               │                     │
               │  Collections:       │
               │  ─ users            │
               │  ─ modules          │
               │  ─ components       │
               │  ─ reviews          │
               │  ─ securityreports  │
               │  ─ versions         │
               └─────────────────────┘
```

---

## 📁 Project Structure

```
Module_Library_Platform/
├── public/                     # Static assets
├── src/                        # React frontend source
│   ├── assets/                 # Images, icons, and media
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # DashboardLayout, Sidebar, TopBar
│   │   ├── security/           # Security scanning widgets
│   │   ├── shared/             # Logo, NotificationPanel
│   │   └── ui/                 # Button, Card, Badge, Input, Avatar
│   ├── data/                   # Static data and mock datasets
│   ├── firebase/               # Firebase initialization
│   ├── hooks/                  # Custom React hooks (useAuth)
│   ├── lib/                    # API client, utilities, AI service
│   ├── pages/                  # Route-level page components
│   │   ├── dashboard/          # Authenticated dashboard pages
│   │   └── docs/               # Developer documentation pages
│   ├── router/                 # React Router configuration
│   ├── App.jsx                 # Root application component
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles and design tokens
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── config/             # Environment and database config
│   │   ├── controllers/        # Route handler business logic
│   │   ├── middleware/         # Auth, CORS, upload, validation
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Module.js
│   │   │   ├── Component.js
│   │   │   ├── Review.js
│   │   │   ├── SecurityReport.js
│   │   │   └── Version.js
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Gemini AI service layer
│   │   ├── utils/              # Helpers, token generation, embeddings
│   │   └── server.js           # Server entry point
│   └── package.json
├── index.html                  # Vite HTML entry
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vercel.json                 # Vercel SPA routing
├── package.json                # Frontend dependencies
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or local MongoDB instance)
- **Firebase** project with Authentication enabled
- **Google Gemini** API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ratanraj180/Module_Library_Platform.git
cd Module_Library_Platform

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server
npm install
cd ..

# 4. Configure environment variables (see section below)

# 5. Start the backend server
cd server
npm run dev

# 6. Start the frontend dev server (in a new terminal)
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## 🔑 Environment Variables

### Frontend (`/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (`/server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/module_library
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_API_KEY=your_firebase_api_key
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Never commit `.env` files to version control.** Both are included in `.gitignore`.

---

## 🤖 AI Features

### Module AI Assistant

The built-in AI assistant uses **Google Gemini 2.5 Flash** with a custom **Retrieval-Augmented Generation (RAG)** pipeline to provide intelligent, context-aware responses.

#### How It Works

```
User Query
    │
    ▼
┌──────────────────┐
│ Intent Classifier │ ──► Greeting / Small Talk / Programming / Technical
└────────┬─────────┘
         │
    Registry Query?
    ┌────┴────┐
    │  Yes    │  No
    ▼         ▼
┌────────┐  ┌──────────┐
│  RAG   │  │  Gemini  │
│Pipeline│  │  Direct  │
└───┬────┘  └────┬─────┘
    │            │
    ▼            ▼
┌────────────────────┐
│  Structured JSON   │
│  Response + Cards  │
└────────────────────┘
```

#### Search Modes

| Mode       | Description                                                            |
|------------|------------------------------------------------------------------------|
| **AI**     | Hybrid RAG — semantic search over MongoDB + Gemini summarization       |
| **Standard** | Keyword-based search with fuzzy matching and relevance scoring      |
| **Vector** | Pure vector similarity search using embeddings and cosine similarity   |

#### RAG Pipeline Details

1. **Query Embedding** — User query is converted to a vector embedding
2. **Semantic Retrieval** — Searches approved modules/components using cosine similarity
3. **Synonym Expansion** — Expands queries using a curated semantic map (e.g., "auth" → JWT, OAuth, RBAC)
4. **Score Boosting** — Boosts results based on title matches, tag overlap, and download popularity
5. **Gemini Synthesis** — Retrieved context is passed to Gemini for a natural-language summary
6. **Structured Output** — Returns recommendations with install commands, confidence scores, and documentation links

---

## 🔐 Authentication Flow

The platform implements a **dual authentication system** combining Firebase Authentication with JWT-based backend sessions.

```
┌──────────────┐     Firebase SDK      ┌──────────────────┐
│   Browser    │ ◄──────────────────►  │  Firebase Auth   │
│  (React App) │   Google Sign-In      │  Service         │
└──────┬───────┘   Email/Password      └──────────────────┘
       │
       │  POST /api/auth/google
       │  POST /api/auth/login
       │  POST /api/auth/signup
       ▼
┌──────────────┐                       ┌──────────────────┐
│   Express    │ ──── Mongoose ────►   │  MongoDB Atlas   │
│   Backend    │   User lookup/create  │  (users)         │
└──────┬───────┘                       └──────────────────┘
       │
       │  JWT Token (7-day expiry)
       ▼
┌──────────────┐
│  localStorage│  ── Bearer token on every API request
└──────────────┘
```

| Method               | Provider                     |
|----------------------|------------------------------|
| Google Sign-In       | Firebase + Backend JWT        |
| Email/Password Login | Backend bcrypt + JWT          |
| Password Reset       | Firebase `sendPasswordResetEmail` |
| Session Management   | JWT stored in localStorage    |

---

## 📦 Module Publishing Workflow

```
Developer                Admin                    Platform
    │                      │                         │
    ├── Submit Module ────►│                         │
    │   (title, code,      │                         │
    │    metadata)         │                         │
    │                      ├── Review Queue ─────────┤
    │                      │   Security Scan         │
    │                      │   Code Review           │
    │                      │                         │
    │                      ├── Approve / Reject ────►│
    │                      │                         │
    │◄── Status Update ────┤                         │
    │                      │                         │
    │                      │              Module Published
    │                      │              to Registry ────►  Available for
    │                      │                                 Search & Download
```

---

## 👑 Admin Review Workflow

Administrators have access to a dedicated review dashboard with the following capabilities:

- **Pending Queue** — View all submitted modules and components awaiting review
- **Approve** — Publish the submission to the public registry
- **Reject** — Decline with a required rejection reason
- **Security Reports** — View automated vulnerability scan results
- **Bulk Actions** — Efficiently process multiple submissions

---

## 📡 API Reference

### Authentication

| Method | Endpoint           | Description            | Auth     |
|--------|--------------------|------------------------|----------|
| POST   | `/api/auth/signup`  | Register new user      | Public   |
| POST   | `/api/auth/login`   | Email/password login   | Public   |
| POST   | `/api/auth/google`  | Google Sign-In         | Public   |
| GET    | `/api/auth/profile` | Get current user       | Required |

### Modules

| Method | Endpoint                       | Description              | Auth     |
|--------|--------------------------------|--------------------------|----------|
| GET    | `/api/modules`                 | List all modules         | Optional |
| GET    | `/api/modules/:id`             | Get module details       | Optional |
| POST   | `/api/modules`                 | Create new module        | Required |
| PUT    | `/api/modules/:id`             | Update module            | Required |
| DELETE | `/api/modules/:id`             | Delete module            | Required |
| POST   | `/api/modules/:id/submit`      | Submit for review        | Required |
| POST   | `/api/modules/:id/approve`     | Approve module           | Admin    |
| POST   | `/api/modules/:id/reject`      | Reject module            | Admin    |
| GET    | `/api/modules/:id/download`    | Download module          | Optional |

### AI Search

| Method | Endpoint          | Description                            | Auth     |
|--------|-------------------|----------------------------------------|----------|
| GET    | `/api/ai/search`  | AI-powered semantic search             | Optional |

### Components, Reviews, Security, Users

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| GET    | `/api/components`     | List components              |
| POST   | `/api/components`     | Publish component            |
| GET    | `/api/reviews`        | List reviews                 |
| POST   | `/api/reviews`        | Submit review                |
| GET    | `/api/security/:id`   | Get security scan report     |
| GET    | `/api/users/:id`      | Get user profile             |

---

## 🚢 Deployment

### Frontend → Vercel

| Setting          | Value                |
|------------------|----------------------|
| Framework        | Vite                 |
| Build Command    | `npm run build`      |
| Output Directory | `dist`               |
| Root Directory   | `/` (repository root)|

Set all `VITE_*` environment variables in **Vercel → Settings → Environment Variables**.

### Backend → Render

| Setting          | Value                |
|------------------|----------------------|
| Runtime          | Node                 |
| Root Directory   | `server`             |
| Build Command    | `npm install`        |
| Start Command    | `npm start`          |

Set all backend environment variables in **Render → Environment**.

### Post-Deployment Checklist

- [ ] `VITE_API_BASE_URL` points to the Render backend URL
- [ ] `CORS_ORIGIN` on Render matches the Vercel frontend URL
- [ ] Firebase Authorized Domains includes the Vercel domain
- [ ] MongoDB Atlas Network Access allows Render's IP (or `0.0.0.0/0`)
- [ ] `vercel.json` rewrites are configured for SPA routing

---

## 📸 Screenshots

> Screenshots coming soon. To preview the platform, visit the [Live Demo](https://module-library-lake.vercel.app).

---

## 🔮 Future Enhancements

- [ ] Real-time notifications via WebSocket
- [ ] GitHub repository import and sync
- [ ] Advanced analytics with chart visualizations
- [ ] Multi-tenant organization workspaces
- [ ] Plugin marketplace with paid tiers
- [ ] CI/CD pipeline integration
- [ ] Automated test coverage reports
- [ ] Dark/Light theme toggle
- [ ] Internationalization (i18n)
- [ ] Rate limiting and API usage quotas

---

## 👨‍💻 Author

**Ratan Raj**

- GitHub: [@ratanraj180](https://github.com/ratanraj180)
- Email: ratanraj_yogendraprasad@srmap.edu.in

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

### ⭐ Found this useful? Star the repository!

If this project helped you or you find it interesting, consider giving it a star.
It helps others discover it and motivates further development.

[![Star this repo](https://img.shields.io/github/stars/ratanraj180/Module_Library_Platform?style=social)](https://github.com/ratanraj180/Module_Library_Platform)

</div>
