class PaymentGateway {
  constructor(config = {}) {
    this.secretKey = config.secretKey || '';
  }

  async createSession({ amount, currency = 'usd', orderId }) {
    console.log(`[PaymentGateway] Creating checkout session for order ${orderId} value: ${amount} ${currency}`);
    return {
      id: `cs_${Math.random().toString(36).substr(2, 9)}`,
      checkoutUrl: `https://checkout.stripe.com/pay/mock_session_${orderId}`,
      amount,
      currency
    };
  }

  async verifyTransaction(sessionId) {
    console.log(`[PaymentGateway] Verifying transaction session ${sessionId}`);
    return { status: 'paid', verifiedAt: new Date() };
  }
}

module.exports = {
  PaymentGateway
};
