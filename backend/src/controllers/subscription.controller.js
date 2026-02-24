/**
 * Subscription Controller (Stripe)
 * 
 * Handles:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Stripe webhook processing
 * - Plan management
 */

const config = require('../config/env');
const User = require('../models/User');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../config/logger');

// Initialize Stripe (lazy to avoid crash if key is not set)
let stripe = null;
const getStripe = () => {
    if (!stripe && config.stripe.secretKey) {
        stripe = require('stripe')(config.stripe.secretKey);
    }
    if (!stripe) {
        throw new ApiError(503, 'Payment service is not configured');
    }
    return stripe;
};

// Plan configurations
const PLANS = {
    free: {
        name: 'Free',
        resumeUploads: 3,
        interviewsPerMonth: 5,
        features: ['Basic ATS Analysis', '5 Mock Interviews/month', 'Basic Feedback'],
    },
    pro: {
        name: 'Pro',
        priceId: config.stripe.proPriceId,
        resumeUploads: -1, // unlimited
        interviewsPerMonth: -1,
        features: [
            'Unlimited ATS Analysis',
            'Unlimited Mock Interviews',
            'AI-Enhanced Feedback (LLM)',
            'Resume Improvement Suggestions',
            'Priority Support',
            'Dark Mode',
        ],
    },
    enterprise: {
        name: 'Enterprise',
        priceId: config.stripe.enterprisePriceId,
        resumeUploads: -1,
        interviewsPerMonth: -1,
        features: [
            'Everything in Pro',
            'Company-Specific Interviews',
            'Video Interview Analysis',
            'Personalized Learning Roadmap',
            'Dedicated Account Manager',
            'API Access',
        ],
    },
};

/**
 * Get available plans
 * GET /api/v1/subscription/plans
 */
const getPlans = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: { plans: PLANS },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current subscription status
 * GET /api/v1/subscription/status
 */
const getSubscriptionStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) throw new ApiError(404, 'User not found');

        const plan = user.subscription?.plan || 'free';
        const planDetails = PLANS[plan] || PLANS.free;

        res.status(200).json({
            success: true,
            data: {
                plan,
                planDetails,
                stripeCustomerId: user.subscription?.stripeCustomerId || null,
                currentPeriodEnd: user.subscription?.currentPeriodEnd || null,
                cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create Stripe checkout session
 * POST /api/v1/subscription/checkout
 */
const createCheckoutSession = async (req, res, next) => {
    try {
        const stripeClient = getStripe();
        const { plan } = req.body;

        if (!plan || !PLANS[plan]?.priceId) {
            throw new ApiError(400, 'Invalid plan selected');
        }

        const user = await User.findById(req.userId);
        if (!user) throw new ApiError(404, 'User not found');

        // Check if already on this plan
        if (user.subscription?.plan === plan) {
            throw new ApiError(400, 'You are already on this plan');
        }

        // Create or retrieve Stripe customer
        let customerId = user.subscription?.stripeCustomerId;
        if (!customerId) {
            const customer = await stripeClient.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
            user.subscription.stripeCustomerId = customerId;
            await user.save();
        }

        // Create checkout session
        const frontendUrl = config.email?.frontendUrl || 'http://localhost:3000';
        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PLANS[plan].priceId,
                    quantity: 1,
                },
            ],
            success_url: `${frontendUrl}/dashboard?subscription=success&plan=${plan}`,
            cancel_url: `${frontendUrl}/dashboard?subscription=cancelled`,
            metadata: {
                userId: user._id.toString(),
                plan,
            },
        });

        logger.info('Checkout session created', { userId: user._id, plan, sessionId: session.id });

        res.status(200).json({
            success: true,
            data: { sessionId: session.id, url: session.url },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create Stripe billing portal session
 * POST /api/v1/subscription/portal
 */
const createPortalSession = async (req, res, next) => {
    try {
        const stripeClient = getStripe();
        const user = await User.findById(req.userId);
        if (!user) throw new ApiError(404, 'User not found');

        if (!user.subscription?.stripeCustomerId) {
            throw new ApiError(400, 'No active subscription found');
        }

        const frontendUrl = config.email?.frontendUrl || 'http://localhost:3000';
        const session = await stripeClient.billingPortal.sessions.create({
            customer: user.subscription.stripeCustomerId,
            return_url: `${frontendUrl}/dashboard/profile`,
        });

        res.status(200).json({
            success: true,
            data: { url: session.url },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel subscription
 * POST /api/v1/subscription/cancel
 */
const cancelSubscription = async (req, res, next) => {
    try {
        const stripeClient = getStripe();
        const user = await User.findById(req.userId);
        if (!user) throw new ApiError(404, 'User not found');

        if (!user.subscription?.stripeSubscriptionId) {
            throw new ApiError(400, 'No active subscription to cancel');
        }

        // Cancel at period end (not immediately)
        await stripeClient.subscriptions.update(user.subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        user.subscription.cancelAtPeriodEnd = true;
        await user.save();

        await AnalyticsEvent.track(user._id, 'subscription_cancel', { plan: user.subscription.plan });
        logger.info('Subscription cancelled', { userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Subscription will be cancelled at the end of the current billing period',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle Stripe webhooks
 * POST /api/v1/subscription/webhook
 */
const handleWebhook = async (req, res, next) => {
    try {
        const stripeClient = getStripe();
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripeClient.webhooks.constructEvent(
                req.body,
                sig,
                config.stripe.webhookSecret
            );
        } catch (err) {
            logger.error('Webhook signature verification failed', { error: err.message });
            return res.status(400).json({ error: 'Webhook signature verification failed' });
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const subscriptionId = session.subscription;

                if (userId && plan) {
                    const user = await User.findById(userId);
                    if (user) {
                        user.subscription.plan = plan;
                        user.subscription.stripeSubscriptionId = subscriptionId;
                        user.subscription.stripeCustomerId = session.customer;
                        user.subscription.cancelAtPeriodEnd = false;
                        await user.save();

                        await AnalyticsEvent.track(userId, 'subscription_upgrade', { plan });
                        logger.info('Subscription activated', { userId, plan });
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const user = await User.findOne({
                    'subscription.stripeSubscriptionId': subscription.id,
                });
                if (user) {
                    user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
                    await user.save();
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const user = await User.findOne({
                    'subscription.stripeSubscriptionId': subscription.id,
                });
                if (user) {
                    user.subscription.plan = 'free';
                    user.subscription.stripeSubscriptionId = null;
                    user.subscription.currentPeriodEnd = null;
                    user.subscription.cancelAtPeriodEnd = false;
                    await user.save();
                    logger.info('Subscription expired', { userId: user._id });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const user = await User.findOne({
                    'subscription.stripeCustomerId': invoice.customer,
                });
                if (user) {
                    logger.warn('Payment failed', { userId: user._id, invoiceId: invoice.id });
                    // Could send email notification here
                }
                break;
            }

            default:
                logger.info('Unhandled Stripe event', { type: event.type });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Webhook processing error', { error: error.message });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

module.exports = {
    getPlans,
    getSubscriptionStatus,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    handleWebhook,
};
