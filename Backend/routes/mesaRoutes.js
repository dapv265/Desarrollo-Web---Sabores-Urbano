import { Router } from 'express';

import {
  obtenerMesas,
  obtenerDisponibilidad,
  actualizarEstadoMesa,
  crearMesa,
  actualizarMesa,
  eliminarMesa
} from '../controllers/mesaController.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  validarEstadoMesa,
  validarIdMesa
} from '../middleware/validarMesa.js';

const router = Router();

const soloAdministradores = [
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL),
];
const rolesSalon = [
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL, ROLES.GARZON),
];

// RF3: Obtener todas las mesas
router.get('/', obtenerMesas);

// RF5: Consultar mesas disponibles
router.get('/disponibilidad', obtenerDisponibilidad);

// RF3: Crear, editar y eliminar mesas (solo administradores)
router.post('/', ...soloAdministradores, crearMesa);
router.put('/:id', ...soloAdministradores, validarIdMesa, actualizarMesa);
router.delete('/:id', ...soloAdministradores, validarIdMesa, eliminarMesa);

// RF3: Actualizar el estado de una mesa (administradores y garzón en salón)
router.patch(
  '/:id/estado',
  ...rolesSalon,
  validarIdMesa,
  validarEstadoMesa,
  actualizarEstadoMesa
);

export default router;
