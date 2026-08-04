class EmailService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.from = config.from || 'no-reply@company.com';
  }

  async sendWelcomeEmail(to, data = {}) {
    console.log(`[EmailService] Sending welcome email to ${to} with variables:`, data);
    return { success: true, messageId: `msg_${Math.random().toString(36).substr(2, 9)}` };
  }

  async sendSystemAlert(to, alertType, data = {}) {
    console.log(`[EmailService] Sending system alert [${alertType}] to ${to} with variables:`, data);
    return { success: true, messageId: `msg_${Math.random().toString(36).substr(2, 9)}` };
  }
}

module.exports = {
  EmailService
};
