import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';
import express from 'express';

const router = Router();

/* TODO: Stripe webhook - needs raw body for signature verification */
router.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    webhookController.handleStripeWebhook.bind(webhookController)
);

router.post(
    '/paystack',
    express.json(),
    webhookController.handlePaystackWebhook.bind(webhookController)
);

export default router;

