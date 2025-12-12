import { Router } from 'express';
import specialRequestController from '../controllers/special-request.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', specialRequestController.create);

router.get('/', authenticate, specialRequestController.list);
router.get('/:id', authenticate, specialRequestController.get);

export default router;

