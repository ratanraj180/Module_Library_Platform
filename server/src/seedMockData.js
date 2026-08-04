const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Module = require('./models/Module');
const Component = require('./models/Component');
const { generateEmbedding } = require('./utils/vectorize');

// Dummy User ID to mimic an owner link
const mockUserId = new mongoose.Types.ObjectId();

const sampleComponents = [
  {
    title: "JWT Authentication Middleware",
    description: "Secure backend middleware for verifying JSON Web Tokens and extracting user payloads in Express routing.",
    category: "Backend Components",
    tags: ["auth", "security", "jwt", "express"],
    frontendCode: "",
    backendCode: "const jwt = require('jsonwebtoken');\nmodule.exports = (req, res, next) => { ... }",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "Responsive Navigation Bar",
    description: "A clean modern navbar component featuring mobile hamburger menu toggle, smooth slide animations, and dark mode compliance.",
    category: "UI Components",
    tags: ["navbar", "ui", "responsive", "react"],
    frontendCode: "export const Navbar = () => { return <nav>...</nav> }",
    backendCode: "",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "Linear System Matrix Solver",
    description: "High-performance native C++ component optimized for solving heavy systems of linear algebraic equations using Gaussian Elimination.",
    category: "Backend Components",
    tags: ["cpp", "math", "matrices", "algorithms", "linear-algebra"],
    frontendCode: "",
    backendCode: "#include <iostream>\nvoid gaussianElimination(float a[N][N+1]) { ... }",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "Data Table with Global Search",
    description: "Re-usable client-side tabular grid displaying datasets with native pagination, alphanumeric filtering, and column sorting capabilities.",
    category: "UI Components",
    tags: ["table", "grid", "search", "react", "frontend"],
    frontendCode: "const DataTable = ({ data }) => { ... }",
    backendCode: "",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "SQL Query Sanitize Helper",
    description: "Backend utility designed to strictly escape, scrub, and sanitize raw user input to prevent SQL Injection vectors inside database queries.",
    category: "Backend Components",
    tags: ["security", "sql", "backend", "database", "node"],
    frontendCode: "",
    backendCode: "function sanitizeInput(str) { return str.replace(/['\"\\\\]/g, '\\$&'); }",
    owner: mockUserId,
    status: "approved"
  }
];

const sampleModules = [
  {
    title: "Structural Vibrations Structural Damage Detector",
    description: "An advanced academic processing script analyzing two-degree-of-freedom mechanical models to detect structural cracks and parameters using Extended Kalman Filters (EKF).",
    category: "Engineering Analysis",
    technology: "C++ / MATLAB",
    categories: ["Simulation", "Vibrations"],
    technologies: ["C++", "CMake"],
    tags: ["kalman-filter", "ekf", "mechanical", "dynamics", "vibrations"],
    repositoryUrl: "https://github.com/renuk/structural-vibrations-ekf",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "E-Commerce Payment Gateway SDK",
    description: "Comprehensive multi-tenant software wrapper managing checkout flows, webhook parsing, ledger updates, and merchant authorization pipelines.",
    category: "Web Development",
    technology: "Node.js",
    categories: ["Fintech", "Backend Frameworks"],
    technologies: ["JavaScript", "Express"],
    tags: ["stripe", "payment", "checkout", "backend"],
    repositoryUrl: "https://github.com/renuk/payment-gateway-node",
    owner: mockUserId,
    status: "approved"
  },
  {
    title: "Git Automated Branch Backup Utility",
    description: "Lightweight command-line automation package cloning remote repositories locally, packing compressed bundles, and streaming backups straight to secure storage arrays.",
    category: "DevOps Tools",
    technology: "Bash / C++",
    categories: ["Automation", "CLI Tools"],
    technologies: ["C++", "Shell Scripting"],
    tags: ["git", "backup", "devops", "automation"],
    repositoryUrl: "https://github.com/renuk/git-backup-cli",
    owner: mockUserId,
    status: "approved"
  }
];

async function seedAndVectorize() {
  console.log('[Test Registry] Connecting to MongoDB Atlas...');
  await connectDB();

  try {
    // Clear out any old records so we have a clean test slate
    await Component.deleteMany({});
    await Module.deleteMany({});
    console.log('[Test Registry] Cleaned out pre-existing documents.');

    // 1. Insert and Vectorize Components
    console.log(`\n[Test Registry] Injecting ${sampleComponents.length} components...`);
    for (const compData of sampleComponents) {
      const textToVectorize = `${compData.title} ${compData.description} ${compData.category} ${compData.tags.join(' ')}`;
      console.log(`-> Creating embedding for Component: ${compData.title}`);
      
      compData.embedding = await generateEmbedding(textToVectorize);
      const newComp = new Component(compData);
      await newComp.save();
    }

    // 2. Insert and Vectorize Modules
    console.log(`\n[Test Registry] Injecting ${sampleModules.length} modules...`);
    for (const modData of sampleModules) {
      const textToVectorize = `${modData.title} ${modData.description} ${modData.category} ${modData.tags.join(' ')} ${modData.technologies.join(' ')}`;
      console.log(`-> Creating embedding for Module: ${modData.title}`);
      
      modData.embedding = await generateEmbedding(textToVectorize);
      const newMod = new Module(modData);
      await newMod.save();
    }

    console.log('\n✅ [Test Registry] Success! Mock registry populated and vectors synced to Atlas.');
    process.exit(0);
  } catch (err) {
    console.error('[Test Registry] Direct seeding failure:', err);
    process.exit(1);
  }
}

seedAndVectorize();