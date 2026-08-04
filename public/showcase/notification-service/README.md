# Notification Service

Reusable notification module supporting toast notifications, email notification templates, notification queue simulation, and alert management.

## Features

- **React Toast Stack**: Visually stunning toast notification manager stack.
- **Email Templates builder**: Reusable layouts for welcome emails, alarms, resets, and metrics alerts.
- **Notification Queue**: Queue simulation mechanism to pool notifications without blocking worker threads.

## Installation

```bash
npm install @org/notification-service
```

## Quick Start React Usage

```jsx
import React from 'react';
import { ToastProvider, useToast } from '@org/notification-service/react';

function Dashboard() {
  const { notify } = useToast();

  return (
    <div className="flex gap-2">
      <button onClick={() => notify('success', 'Order created successfully!')}>Success Alert</button>
      <button onClick={() => notify('error', 'Failed to submit payment.')}>Danger Alert</button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
```

## Setup Email Notifications

```javascript
const { EmailService } = require('@org/notification-service');

const emailer = new EmailService({
  apiKey: process.env.SENDGRID_API_KEY,
  from: 'notifications@company.com'
});

emailer.sendWelcomeEmail('user@test.com', { name: 'John Doe' });
```

## License

Internal Enterprise License. (C) 2026.
