import { Router } from 'express';
import { createKey, revokeKey, listKeys } from '../controllers/apiKeyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', createKey);
router.delete('/:id', revokeKey);
router.get('/', listKeys);

export default router;
