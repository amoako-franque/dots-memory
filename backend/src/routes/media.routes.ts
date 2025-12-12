import { Router } from "express"
import mediaController from "../controllers/media.controller"
import reactionController from "../controllers/reaction.controller"
import { authenticate } from "../middleware/auth"

const router = Router()

router.post("/initiate", authenticate, mediaController.initiateUpload)
router.post("/:id/confirm", authenticate, mediaController.confirmUpload)
router.post("/:id/cancel", authenticate, mediaController.cancelUpload)
router.get("/:id", authenticate, mediaController.get)
router.delete("/:id", authenticate, mediaController.delete)
router.patch("/:id/caption", authenticate, mediaController.updateCaption)

router.post("/:id/reactions", reactionController.addReaction)
router.delete("/:id/reactions/:emoji", reactionController.removeReaction)
router.get("/:id/reactions", reactionController.getReactions)

export default router
