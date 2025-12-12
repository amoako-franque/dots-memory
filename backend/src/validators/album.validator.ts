import { z } from 'zod';

export const createAlbumSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().max(500).optional(),
    eventDate: z.string().datetime().optional(),
    eventLocation: z.string().max(200).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    settings: z.object({
        privacy: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
        maxFileSizeMB: z.number().min(1).max(500).default(100),
        maxVideoLengthSec: z.number().min(30).max(600).default(300),
        allowVideos: z.boolean().default(true),
        requireContributorName: z.boolean().default(false),
        accessCode: z.string().min(4, 'Access code must be at least 4 characters').max(20).optional(),
        uploadDescription: z.string().max(500).optional(),
    }).optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial();
