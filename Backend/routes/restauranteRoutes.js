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

router.get('/', validarFiltroEstadoRestaurante, listarRestaurantes);
router.get(
  '/codigo/:codigo',
  validarCodigoRestaurante,
  obtenerRestaurantePorCodigo,
);
router.get('/:id', validarIdRestaurante, obtenerRestaurantePorId);
router.post(
  '/',
  restauranteCreateValidators,
  validateRequest,
  crearRestaurante,
);
router.put(
  '/:id',
  validarIdRestaurante,
  restauranteUpdateValidators,
  validateRequest,
  actualizarRestaurante,
);
router.patch(
  '/:id/estado',
  validarIdRestaurante,
  validarEstadoRestaurante,
  cambiarEstadoRestaurante,
);
router.delete('/:id', validarIdRestaurante, eliminarRestaurante);

export default router;
