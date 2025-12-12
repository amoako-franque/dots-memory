import { Router } from "express"
import albumController from "../controllers/album.controller"
import analyticsController from "../controllers/analytics.controller"
import mediaController from "../controllers/media.controller"
import { authenticate } from "../middleware/auth"
import { albumViewLimiter } from "../middleware/rateLimit"

const router = Router()

router.post("/", authenticate, albumController.create)
router.get("/", authenticate, albumController.list)
router.get("/:id", authenticate, albumViewLimiter, albumController.get)
router.put("/:id", authenticate, albumController.update)
router.delete("/:id", authenticate, albumController.delete)

router.post("/:id/archive", authenticate, albumController.archive)
router.post("/:id/restore", authenticate, albumController.restore)
router.get("/:id/contributors", authenticate, albumController.getContributors)
router.post(
	"/:id/access-codes/generate",
	authenticate,
	albumController.generateAccessCode
)
router.get("/:id/access-codes", authenticate, albumController.listAccessCodes)
router.post(
	"/:id/access-codes/blacklist",
	authenticate,
	albumController.blacklistAccessCode
)
router.post(
	"/:id/access-codes/unblacklist",
	authenticate,
	albumController.unblacklistAccessCode
)
router.delete(
	"/:id/access-codes",
	authenticate,
	albumController.deleteAccessCode
)

router.get("/:id/sessions", authenticate, albumController.listSessions)
router.post("/:id/sessions/revoke", authenticate, albumController.revokeSession)
router.post(
	"/:id/sessions/blacklist",
	authenticate,
	albumController.blacklistSession
)
router.post(
	"/:id/sessions/unblacklist",
	authenticate,
	albumController.unblacklistSession
)

router.post(
	"/:id/regenerate-identifiers",
	authenticate,
	albumController.regenerateIdentifiers
)

router.get("/:albumId/media", authenticate, mediaController.listByAlbum)
router.get("/:id/media-urls", authenticate, albumController.getMediaUrls)

router.get(
	"/:id/analytics",
	authenticate,
	analyticsController.getAlbumAnalytics
)
router.get("/:id/stats", authenticate, analyticsController.getAlbumStats)
router.get("/:id/activity", authenticate, analyticsController.getRecentActivity)

export default router
