import { z } from "zod"

export const initiateUploadSchema = z.object({
	albumId: z.string().uuid(),
	fileName: z.string().min(1),
	fileType: z.string().regex(/^(image|video)\//, "Invalid file type"),
	fileSize: z.number().positive(),
	width: z.number().optional(),
	height: z.number().optional(),
	duration: z.number().optional(),
	sessionToken: z.string().optional(),
})
