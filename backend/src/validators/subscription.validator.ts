import { z } from 'zod';

export const upgradeSubscriptionSchema = z.object({
    planId: z.string().uuid('Invalid plan ID format'),
});
