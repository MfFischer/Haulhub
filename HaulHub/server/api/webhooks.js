const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment');

// Stripe webhook
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await paymentService.handleStripeWebhook(event);
    res.json({received: true});
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// PayPal webhook
router.post('/paypal', async (req, res) => {
  try {
    await paymentService.handlePayPalWebhook(req.body);
    res.json({received: true});
  } catch (err) {
    console.error('PayPal webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;