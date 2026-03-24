/**
 * Subscription Routes (Stripe)
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    getPlans,
    getSubscriptionStatus,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    handleWebhook,
} = require('../controllers/subscription.controller');

const router = express.Router();

// Webhook (must be before body parsing - needs raw body)
// Note: This route must be mounted with express.raw() in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Public
router.get('/plans', getPlans);

// Protected
router.get('/status', protect, getSubscriptionStatus);
router.post('/checkout', protect, createCheckoutSession);
router.post('/portal', protect, createPortalSession);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;
