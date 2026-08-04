export const marketplaceComponents = [
  // ─── UI COMPONENTS ──────────────────────────────────────────────────────────
  {
    id: "button-component",
    name: "Button Component",
    description: "A flexible and interactive button component supporting primary, secondary, outline, and destructive variants.",
    category: "ui",
    technology: "React, Tailwind CSS",
    tags: ["UI", "Form", "Button", "Interactive"],
    dependencies: "lucide-react, clsx, tailwind-merge",
    installation: "npm install lucide-react clsx tailwind-merge",
    frontendCode: `import React from 'react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-gold-500 text-black hover:bg-gold-600 active:bg-gold-700',
    secondary: 'bg-white/[0.04] text-white hover:bg-white/[0.08] border border-white/[0.08]',
    outline: 'border border-gold-500/20 bg-transparent text-gold-400 hover:bg-gold-500/10',
    destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}`,
    backendCode: `// Button Component is purely a frontend design element. 
// No explicit backend controller is needed, but click analytics can be posted to:
// POST /api/analytics/clicks { elementId: "button" }`,
    usage: `import { Button } from './components/Button';

export default function App() {
  return (
    <div className="flex gap-4">
      <Button variant="primary">Submit</Button>
      <Button variant="secondary" loading>Loading...</Button>
    </div>
  );
}`
  },
  {
    id: "login-form",
    name: "Login Form",
    description: "A secure, validated authentication form utilizing form-state verification and clean password-visibility toggling.",
    category: "ui",
    technology: "React, Lucide Icons",
    tags: ["UI", "Auth", "Form", "Login"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm w-full">
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-lg pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold rounded-lg mt-2">
        Sign In
      </button>
    </form>
  );
}`,
    backendCode: `// Connect this form to your authentication service endpoint
const express = require('express');
const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Authenticate user logic here...
  res.json({ token: 'jwt-auth-token-sample' });
});

module.exports = router;`,
    usage: `import { LoginForm } from './LoginForm';

export function LoginPage() {
  const handleLogin = (credentials) => {
    console.log('Logging in with:', credentials);
  };

  return <LoginForm onSubmit={handleLogin} />;
}`
  },
  {
    id: "navbar",
    name: "Navbar",
    description: "Responsive top navigation bar with blur effect and custom menu item support.",
    category: "ui",
    technology: "React, Tailwind CSS",
    tags: ["UI", "Navigation", "Navbar", "Layout"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React from 'react';
import { Menu, Bell } from 'lucide-react';

export function Navbar({ onMenuToggle, user }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050505]/75 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="md:hidden text-muted-foreground hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-mono text-sm font-bold text-white tracking-tight">
            Module<span className="text-gold-400">Lib</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-white relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-gold-500" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gold-500 to-gold-700 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}`,
    backendCode: `// Public navigation data provider
const express = require('express');
const router = express.Router();

router.get('/api/navigation', (req, res) => {
  res.json([
    { label: 'Browse', path: '/components' },
    { label: 'Registry', path: '/dashboard/modules' }
  ]);
});

module.exports = router;`,
    usage: `import { Navbar } from './Navbar';

export function Layout() {
  return <Navbar user={{ name: 'Admin' }} />;
}`
  },
  {
    id: "sidebar",
    name: "Sidebar",
    description: "Collapsible vertical navigation sidebar with active link border indicator and workspace avatar selector.",
    category: "ui",
    technology: "React, Router",
    tags: ["UI", "Sidebar", "Navigation", "Layout"],
    dependencies: "lucide-react, react-router-dom",
    installation: "npm install lucide-react react-router-dom",
    frontendCode: `import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, Shield } from 'lucide-react';

export function Sidebar({ role }) {
  const items = [
    { label: 'Overview', path: '/overview', icon: LayoutDashboard },
    { label: 'Components', path: '/components', icon: Package },
    { label: 'Governance', path: '/security', icon: Shield },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-[#0a0a0a] border-r border-white/[0.06] h-full flex flex-col">
      <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-gold-500 flex items-center justify-center text-black font-bold">M</div>
        <span className="font-bold text-white text-sm">Dashboard</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              \`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all
              \${isActive ? 'bg-gold-500/10 text-gold-300 border-l-2 border-gold-400 pl-[10px]' : 'text-muted-foreground hover:text-white hover:bg-white/[0.02]'}\`
            }
          >
            <item.icon size={15} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}`,
    backendCode: `// Backend configuration mapping for roles
const express = require('express');
const router = express.Router();

router.get('/api/sidebar-config', (req, res) => {
  res.json({
    role: req.user?.role || 'guest',
    allowedModules: ['/overview', '/components']
  });
});

module.exports = router;`,
    usage: `import { Sidebar } from './Sidebar';

export function AdminLayout() {
  return <Sidebar role="admin" />;
}`
  },
  {
    id: "dashboard-card",
    name: "Dashboard Card",
    description: "Unified UI wrapper supporting modern glassmorphism panels, header structures, and hover action states.",
    category: "ui",
    technology: "React, Tailwind",
    tags: ["UI", "Card", "Dashboard", "Container"],
    dependencies: "clsx",
    installation: "npm install clsx",
    frontendCode: `import React from 'react';
import { cn } from '../lib/utils';

export function DashboardCard({ children, className, hover = false }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] bg-[#0c0c0c]/80 backdrop-blur-sm p-5",
        hover && "hover:border-gold-500/20 hover:bg-white/[0.01] transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}`,
    backendCode: `// Pure design component. No backend needed.`,
    usage: `import { DashboardCard } from './DashboardCard';

export function Overview() {
  return (
    <DashboardCard hover>
      <h3 className="text-sm font-bold text-white">System Status</h3>
      <p className="text-xs text-muted-foreground mt-1">All pipelines operational.</p>
    </DashboardCard>
  );
}`
  },
  {
    id: "modal",
    name: "Modal",
    description: "Overlay dialog overlaying context to request confirmation, show inputs, or display information overlays.",
    category: "ui",
    technology: "React, Portal",
    tags: ["UI", "Dialog", "Modal", "Overlay"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel container */}
      <div className="relative z-10 w-full max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={16} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">{children}</div>
      </div>
    </div>,
    document.body
  );
}`,
    backendCode: `// Pure design component. No backend needed.`,
    usage: `import { useState } from 'react';
import { Modal } from './Modal';

export function View() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Audit Confirm">
        Confirm dependencies verification scan?
      </Modal>
    </div>
  );
}`
  },
  {
    id: "table",
    name: "Table",
    description: "A tabular representation template to display complex records with category headers and hover highlighting rows.",
    category: "ui",
    technology: "React, HTML5",
    tags: ["UI", "Table", "Data", "Grid"],
    dependencies: "None",
    installation: "None required",
    frontendCode: `import React from 'react';

export function Table({ headers, data, renderRow }) {
  return (
    <div className="w-full overflow-x-auto border border-white/[0.06] bg-black/20 rounded-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02] text-muted-foreground font-semibold">
            {headers.map((h, i) => (
              <th key={i} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04] text-muted-foreground">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}`,
    backendCode: `// Paginated backend query template
const express = require('express');
const router = express.Router();

router.get('/api/table-records', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  // Query DB with skip: (page-1)*limit, limit: limit...
  res.json({ data: [], totalPages: 1 });
});

module.exports = router;`,
    usage: `import { Table } from './Table';

export function MembersTable() {
  return (
    <Table
      headers={['Name', 'Role']}
      data={[{ name: 'Jane', role: 'Dev' }]}
      renderRow={(row, i) => (
        <tr key={i}>
          <td className="p-3 font-semibold text-white">{row.name}</td>
          <td className="p-3">{row.role}</td>
        </tr>
      )}
    />
  );
}`
  },
  {
    id: "search-bar",
    name: "Search Bar",
    description: "High-end input selector featuring search icons, reset controls, and hotkey trigger indicators.",
    category: "ui",
    technology: "React, Lucide",
    tags: ["UI", "Input", "Search", "Form"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React, { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key === 'k') {
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative max-w-sm w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-lg pl-10 pr-12 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
        placeholder={placeholder}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/[0.05] text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-mono select-none">
        ⌘K
      </kbd>
    </div>
  );
}`,
    backendCode: `// Backend filtering pattern
const express = require('express');
const router = express.Router();

router.get('/api/search', async (req, res) => {
  const query = req.query.q || '';
  // Run regex query against database: { name: { $regex: query, $options: 'i' } }
  res.json({ results: [] });
});

module.exports = router;`,
    usage: `import { SearchBar } from './SearchBar';

export function Header() {
  const [query, setQuery] = React.useState('');
  return <SearchBar value={query} onChange={setQuery} />;
}`
  },
  {
    id: "analytics-card",
    name: "Analytics Card",
    description: "Sleek metric summary card incorporating micro-charts, progress trend vectors, and colored indicators.",
    category: "ui",
    technology: "React, SVG Charts",
    tags: ["UI", "Analytics", "Chart", "Card"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AnalyticsCard({ title, value, change, isPositive = true, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-5 space-y-3">
      <div className="flex justify-between items-start">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="h-7 w-7 rounded bg-gold-500/10 text-gold-400 flex items-center justify-center">
            <Icon size={14} />
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xl font-bold text-white">{value}</h4>
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
          <span className={isPositive ? 'text-emerald-400 flex items-center' : 'text-red-400 flex items-center'}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </div>
    </div>
  );
}`,
    backendCode: `// Analytics data aggregator
const express = require('express');
const router = express.Router();

router.get('/api/analytics/metrics', async (req, res) => {
  // Aggregate DB counts, compute growth percentages...
  res.json({ totalDownloads: 1200, growthRate: '15.4%' });
});

module.exports = router;`,
    usage: `import { AnalyticsCard } from './AnalyticsCard';
import { Download } from 'lucide-react';

export function Panel() {
  return <AnalyticsCard title="Downloads" value="1,240" change="+12%" icon={Download} />;
}`
  },
  {
    id: "profile-card",
    name: "Profile Card",
    description: "A compact profile summary card showing workspace avatar, title descriptions, and action control groups.",
    category: "ui",
    technology: "React, Radix",
    tags: ["UI", "Card", "Profile", "User"],
    dependencies: "lucide-react",
    installation: "npm install lucide-react",
    frontendCode: `import React from 'react';
import { Mail, Github, Link2 } from 'lucide-react';

export function ProfileCard({ user }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0c] p-6 max-w-sm w-full text-center space-y-4">
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 ring-4 ring-gold-500/20 flex items-center justify-center text-xl font-bold text-white">
        {user.name?.[0]}
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">{user.name}</h3>
        <p className="text-[10px] text-gold-400 uppercase tracking-widest mt-1 font-semibold">{user.role}</p>
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{user.bio}</p>
      </div>
      <div className="flex justify-center gap-3 pt-2 text-muted-foreground">
        <button className="hover:text-white transition-colors"><Mail size={15} /></button>
        <button className="hover:text-white transition-colors"><Github size={15} /></button>
      </div>
    </div>
  );
}`,
    backendCode: `// Profile endpoint returns database profile records
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/api/users/profile', auth, (req, res) => {
  res.json({ name: req.user.name, role: req.user.role, bio: 'Developer' });
});

module.exports = router;`,
    usage: `import { ProfileCard } from './ProfileCard';

export function Widget() {
  return (
    <ProfileCard user={{ name: 'Jane', role: 'developer', bio: 'Platform developer.' }} />
  );
}`
  },

  // ─── BACKEND COMPONENTS ──────────────────────────────────────────────────────
  {
    id: "jwt-auth-middleware",
    name: "JWT Authentication Middleware",
    description: "Express route middleware executing header extraction, token verification, and payload decoration.",
    category: "backend",
    technology: "Node.js, Express, jsonwebtoken",
    tags: ["Backend", "Auth", "Security", "JWT"],
    dependencies: "jsonwebtoken",
    installation: "npm install jsonwebtoken",
    frontendCode: `// Pure backend configuration block. No frontend React layout required.`,
    backendCode: `const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // Extract token from request authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    req.user = verified; // Decorate user data to request context
    next();
  } catch (err) {
    res.status(400).json({ error: 'Authentication failed. Invalid token.' });
  }
};`,
    usage: `const auth = require('./authMiddleware');
const express = require('express');
const app = express();

app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Success', user: req.user });
});`
  },
  {
    id: "role-authorization-middleware",
    name: "Role-Based Authorization Middleware",
    description: "Guard router endpoints by validating specific authenticated user roles (e.g. developer, admin).",
    category: "backend",
    technology: "Node.js, Express",
    tags: ["Backend", "Auth", "Security", "RBAC"],
    dependencies: "None",
    installation: "None required",
    frontendCode: `// Pure backend authorization guard configuration.`,
    backendCode: `// Middleware validates if req.user role matches permissions requirements
module.exports = function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated session.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access Forbidden: Insufficient permissions.' });
    }

    next();
  };
};`,
    usage: `const allowRoles = require('./allowRoles');
const auth = require('./authMiddleware');
const express = require('express');
const router = express.Router();

router.delete('/api/modules/:id', auth, allowRoles('admin'), (req, res) => {
  res.json({ message: 'Deleted' });
});`
  },
  {
    id: "mongodb-connection-utility",
    name: "MongoDB Connection Utility",
    description: "Database connection manager utilizing Mongoose, featuring status listeners and reconnection hooks.",
    category: "backend",
    technology: "Node.js, Mongoose",
    tags: ["Backend", "Database", "MongoDB", "Utility"],
    dependencies: "mongoose",
    installation: "npm install mongoose",
    frontendCode: `// Pure database infrastructure code.`,
    backendCode: `const mongoose = require('mongoose');

async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri || 'mongodb://localhost:27017/module_library', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection initialized successfully.');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;`,
    usage: `const connectDB = require('./connectDB');
require('dotenv').config();

connectDB(process.env.MONGO_URI);`
  },
  {
    id: "express-error-handler",
    name: "Express Error Handler",
    description: "Global middleware intercepting application exceptions to print stack traces and clean API schemas.",
    category: "backend",
    technology: "Node.js, Express",
    tags: ["Backend", "Error Handling", "Express"],
    dependencies: "None",
    installation: "None required",
    frontendCode: `// Backend infrastructure component.`,
    backendCode: `// Global error interceptor middleware
module.exports = function errorHandler(err, req, res, next) {
  console.error('[Error Handler Log]:', err.stack);

  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected platform error occurred.';

  res.status(statusCode).json({
    success: false,
    error: {
      status: statusCode,
      message: message,
      // Stack traces only visible during development
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};`,
    usage: `const errorHandler = require('./errorHandler');
const express = require('express');
const app = express();

// Register at end of middleware chain
app.use(errorHandler);`
  },
  {
    id: "validation-middleware",
    name: "Validation Middleware",
    description: "Request validator using express-validator, returning clean field-mapped client error messages.",
    category: "backend",
    technology: "Node.js, express-validator",
    tags: ["Backend", "Validator", "Express"],
    dependencies: "express-validator",
    installation: "npm install express-validator",
    frontendCode: `// Backend route validator component.`,
    backendCode: `const { validationResult } = require('express-validator');

// Intercepts validation errors from route schemas
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = {};
  errors.array().forEach(err => {
    extractedErrors[err.path] = err.msg;
  });

  return res.status(422).json({
    success: false,
    errors: extractedErrors
  });
};`,
    usage: `const validate = require('./validate');
const { body } = require('express-validator');

router.post('/signup', [
  body('email').isEmail().withMessage('Enter valid email'),
  body('password').isLength({ min: 6 }).withMessage('Minimum 6 chars')
], validate, controller);`
  },
  {
    id: "file-upload-utility",
    name: "File Upload Utility",
    description: "Configure local storage rules for file uploads, validating file extensions and sizes.",
    category: "backend",
    technology: "Node.js, Multer",
    tags: ["Backend", "Upload", "Utility"],
    dependencies: "multer",
    installation: "npm install multer",
    frontendCode: `// Backend file receiver logic.`,
    backendCode: `const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Format error: Only ZIP code archives are allowed.'));
    }
  }
});

module.exports = upload;`,
    usage: `const upload = require('./upload');
router.post('/modules', upload.single('file'), (req, res) => {
  res.json({ fileUrl: req.file.path });
});`
  },
  {
    id: "logging-middleware",
    name: "Logging Middleware",
    description: "HTTP logger middleware printing request duration, path segments, and response statuses.",
    category: "backend",
    technology: "Node.js, Express",
    tags: ["Backend", "Logging", "Middleware"],
    dependencies: "None",
    installation: "None required",
    frontendCode: `// Backend diagnostics utility.`,
    backendCode: `// Simple custom log formatter
module.exports = function logger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      \`[\${new Date().toISOString()}] \${req.method} \${req.originalUrl} \${res.statusCode} - \${duration}ms\`
    );
  });

  next();
};`,
    usage: `const logger = require('./logger');
const express = require('express');
const app = express();

app.use(logger);`
  },
  {
    id: "api-response-formatter",
    name: "API Response Formatter",
    description: "Express response decorator standardizing payload structures and error shapes.",
    category: "backend",
    technology: "Node.js, Express",
    tags: ["Backend", "Formatter", "Express"],
    dependencies: "None",
    installation: "None required",
    frontendCode: `// Standardizing backend API wrappers.`,
    backendCode: `// Response decorator helper
module.exports = function apiResponse(req, res, next) {
  res.success = (data, message = 'Success', status = 200) => {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  };

  res.error = (error, status = 500) => {
    return res.status(status).json({
      success: false,
      error: typeof error === 'string' ? { message: error } : error
    });
  };

  next();
};`,
    usage: `const apiResponse = require('./apiResponse');
app.use(apiResponse);

app.get('/users', (req, res) => {
  res.success([{ name: 'John' }]);
});`
  }
];
