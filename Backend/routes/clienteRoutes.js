import { Router } from 'express';

import {
  actualizar,
  crear,
  eliminar,
  listar,
  obtenerPorId,
} from '../controllers/clienteController.js';
import {
  ROLES_CONSULTA_CLIENTES,
  ROLES_GESTION_CLIENTES,
} from '../constants/roles.js';
import {
  authenticate,
  authorizeRoles,
} from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  clienteCreateValidators,
  clienteIdValidators,
  clienteUpdateValidators,
} from '../validators/clienteValidators.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorizeRoles(...ROLES_CONSULTA_CLIENTES),
  listar,
);
router.get(
  '/:id',
  authenticate,
  authorizeRoles(...ROLES_CONSULTA_CLIENTES),
  clienteIdValidators,
  validateRequest,
  obtenerPorId,
);
router.post(
  '/',
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  clienteCreateValidators,
  validateRequest,
  crear,
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  [...clienteIdValidators, ...clienteUpdateValidators],
  validateRequest,
  actualizar,
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  clienteIdValidators,
  validateRequest,
  eliminar,
);

export default router;
