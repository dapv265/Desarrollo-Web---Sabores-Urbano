import { Router } from 'express';

import { login, perfil, register } from '../controllers/authController.js';
import { ROLES } from '../constants/roles.js';
import {
  authenticate,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  loginValidators,
  registerValidators,
} from '../validators/authValidators.js';

const router = Router();

router.post(
  '/register',
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL),
  registerValidators,
  validateRequest,
  register,
);
router.post('/login', loginValidators, validateRequest, login);
router.get('/perfil', authenticate, perfil);

export default router;
