import { Router } from "express"
import publicController from "../controllers/public.controller"
import { accessCodeVerificationLimiter } from "../middleware/rateLimit"

const router = Router()

router.get("/album/:id", publicController.getAlbum)

router.post(
	"/album/:id/verify-access",
	accessCodeVerificationLimiter,
	publicController.verifyAccess
)

router.get("/album/:id/media", publicController.getMedia)
router.get("/album/:id/media-urls", publicController.getMediaUrls)

router.get("/albums", publicController.getPublicAlbums)

export default router
