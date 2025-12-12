import { Router } from "express"
import subscriptionController from "../controllers/subscription.controller"
import { authenticate } from "../middleware/auth"

const router = Router()

/* TODO: All routes require authentication */
router.use(authenticate)

router.get("/plans", subscriptionController.getPlans)

router.get("/current", subscriptionController.getCurrentSubscription)

router.get("/usage", subscriptionController.getUsage)

router.get("/limits", subscriptionController.getLimits)

router.post("/checkout", subscriptionController.createCheckoutSession)

router.post("/switch", subscriptionController.switchPlan)

router.post("/upgrade", subscriptionController.switchPlan)

router.post("/cancel", subscriptionController.cancelSubscription)

export default router
