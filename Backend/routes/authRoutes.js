import { Router } from 'express';

import {
  cambiarEstadoUsuario,
  listarUsuarios,
  login,
  perfil,
  register,
} from '../controllers/authController.js';
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
router.get(
  '/usuarios',
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL),
  listarUsuarios,
);
router.patch(
  '/usuarios/:id/estado',
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL),
  cambiarEstadoUsuario,
);

export default router;
