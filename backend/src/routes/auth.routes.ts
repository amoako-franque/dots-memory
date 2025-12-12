import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { passwordResetLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

export default router;
