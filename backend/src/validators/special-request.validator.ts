import { z } from 'zod';

export const createSpecialRequestSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    organizationName: z.string().max(200).optional(),
    phoneNumber: z.string().max(20).optional(),
    requestType: z.enum(['EVENT', 'PROJECT', 'ENTERPRISE']),
    eventName: z.string().max(200).optional(),
    eventDate: z.string().optional(),
    eventLocation: z.string().max(200).optional(),
    expectedAttendees: z.number().int().min(1).optional(),
    expectedAlbums: z.number().int().min(1).optional(),
    expectedPhotos: z.number().int().min(0).optional(),
    expectedVideos: z.number().int().min(0).optional(),
    storageNeededGB: z.number().int().min(1).optional(),
    customFeatures: z.array(z.string()).optional(),
    specialRequirements: z.string().max(5000).optional(),
    budget: z.number().min(0).optional(),
    calculatedPrice: z.number().min(0).optional(),
});

export type CreateSpecialRequestInput = z.infer<typeof createSpecialRequestSchema>;

