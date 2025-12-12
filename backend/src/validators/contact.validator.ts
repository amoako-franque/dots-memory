import { z } from 'zod';

export const createContactMessageSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description is too long'),
    tags: z.array(z.string()).optional().default([]),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;

