# Auth Module

Enterprise authentication module with JWT authentication, role-based access control, password hashing using bcrypt, login, signup, token verification, and protected routes. Designed as a plug-and-play internal company package.

## Features

- **JWT Auth**: Full JSON Web Token generation, signature validation, and payload decoding.
- **RBAC (Role Based Access Control)**: Middleware-driven route protection with role hierarchies (`developer`, `admin`).
- **Security First**: High-performance password hashing via `bcrypt` and token verification.
- **Client Components**: Ready-to-use React login/signup hooks and context wrapper.

## Installation

```bash
npm install @org/auth-module
```

## Setup & Configuration

Define the following environment variables in your server configuration:

```env
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/company_auth
```

## Quick Start API Usage

### Backend integration

```javascript
const express = require('express');
const { authMiddleware, requireRole } = require('@org/auth-module');

const app = express();
app.use(express.json());

// Protected Route (Requires authentication)
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({ message: `Welcome to the secure dashboard, ${req.user.name}!` });
});

// Admin Only Route (Requires admin role)
app.get('/api/admin/settings', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome to admin panel control systems' });
});
```

### Frontend React context

```jsx
import React from 'react';
import { AuthProvider, useAuth } from '@org/auth-module/react';

function UserProfile() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <button onClick={() => login('user@company.com', 'password')}>Log In</button>;
  }

  return (
    <div>
      <p>Hello, {user.name} ({user.role})</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

## License

Internal Enterprise License. (C) 2026.
