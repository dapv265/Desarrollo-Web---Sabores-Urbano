import { Router } from 'express';

import {
  actualizarRestaurante,
  cambiarEstadoRestaurante,
  crearRestaurante,
  eliminarRestaurante,
  listarRestaurantes,
  obtenerRestaurantePorCodigo,
  obtenerRestaurantePorId,
} from '../controllers/restauranteController.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  validarCodigoRestaurante,
  validarEstadoRestaurante,
  validarFiltroEstadoRestaurante,
  validarIdRestaurante,
} from '../middleware/validarRestaurante.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  restauranteCreateValidators,
  restauranteUpdateValidators,
} from '../validators/restauranteValidators.js';

const router = Router();

const soloAdminGeneral = [authenticate, authorizeRoles(ROLES.ADMIN_GENERAL)];

router.get('/', validarFiltroEstadoRestaurante, listarRestaurantes);
router.get(
  '/codigo/:codigo',
  validarCodigoRestaurante,
  obtenerRestaurantePorCodigo,
);
router.get('/:id', validarIdRestaurante, obtenerRestaurantePorId);
router.post(
  '/',
  ...soloAdminGeneral,
  restauranteCreateValidators,
  validateRequest,
  crearRestaurante,
);
router.put(
  '/:id',
  ...soloAdminGeneral,
  validarIdRestaurante,
  restauranteUpdateValidators,
  validateRequest,
  actualizarRestaurante,
);
router.patch(
  '/:id/estado',
  ...soloAdminGeneral,
  validarIdRestaurante,
  validarEstadoRestaurante,
  cambiarEstadoRestaurante,
);
router.delete('/:id', ...soloAdminGeneral, validarIdRestaurante, eliminarRestaurante);

export default router;
