import { Router } from 'express';
import contactController from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', contactController.create);

router.get('/', authenticate, contactController.list);
router.get('/:id', authenticate, contactController.get);

export default router;

