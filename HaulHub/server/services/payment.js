const { stripe, paypalClient } = require('../config/payment');
const paypal = require('@paypal/checkout-server-sdk');

class PaymentService {
  // Stripe Methods
  async createStripeAccount(user) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: user.country || 'US',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true }
        }
      });
      return account;
    } catch (error) {
      console.error('Stripe account creation error:', error);
      throw error;
    }
  }

  async createStripePayout(amount, accountId) {
    try {
      const payout = await stripe.payouts.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        method: 'standard',
        destination: accountId
      });
      return payout;
    } catch (error) {
      console.error('Stripe payout error:', error);
      throw error;
    }
  }

  // PayPal Methods
  async createPayPalPayout(amount, email, description = 'Microsendr Payout') {
    try {
      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          sender_batch_id: `PAYOUT_${Date.now()}`,
          email_subject: "You have received a payout from Microsendr",
          email_message: description
        },
        items: [{
          recipient_type: "EMAIL",
          amount: {
            value: amount,
            currency: "USD"
          },
          receiver: email,
          note: description
        }]
      });

      const response = await paypalClient.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal payout error:', error);
      throw error;
    }
  }

  // Webhook handlers
  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'payout.paid':
        await this.handlePayoutSuccess(event.data.object);
        break;
      case 'payout.failed':
        await this.handlePayoutFailure(event.data.object);
        break;
      // Add more webhook handlers as needed
    }
  }

  async handlePayPalWebhook(event) {
    switch (event.event_type) {
      case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
        await this.handlePayoutSuccess(event.resource);
        break;
      case 'PAYMENT.PAYOUTSBATCH.DENIED':
        await this.handlePayoutFailure(event.resource);
        break;
      // Add more webhook handlers as needed
    }
  }
}

module.exports = new PaymentService();