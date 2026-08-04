# Payment Gateway Module

Reusable payment processing module with checkout flow, order creation, payment status tracking, transaction history, and API integration structure.

## Features

- **Checkout API integration**: Structured checkout hooks and endpoints.
- **Transactions Logger**: Transaction state models tracking approvals, failures, and refunds.
- **Refund flows**: Order cancellation endpoints with safe validation thresholds.

## Installation

```bash
npm install @org/payment-gateway-module
```

## Quick Start API Usage

```javascript
const express = require('express');
const { PaymentGateway } = require('@org/payment-gateway-module');

const app = express();
app.use(express.json());

const pgt = new PaymentGateway({
  secretKey: process.env.STRIPE_SECRET_KEY || 'stripe_key_mock'
});

// Create checkout session
app.post('/api/checkout/create-session', async (req, res) => {
  const { amount, currency, orderId } = req.body;
  try {
    const session = await pgt.createSession({ amount, currency, orderId });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Setup Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_51...
PAYMENT_CURRENCY=USD
```

## License

Internal Enterprise License. (C) 2026.
