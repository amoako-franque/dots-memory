import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.get('/me/stats', authenticate, userController.getStats);
router.delete('/me', authenticate, userController.deleteAccount);

export default router;
