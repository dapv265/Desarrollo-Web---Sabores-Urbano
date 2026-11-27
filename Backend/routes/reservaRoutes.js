
import { Router } from 'express';

import {
  obtenerReservas,
  obtenerReservaPorId,
  comprobarDisponibilidad,
  crearReserva,
  actualizarReserva,
  cambiarEstadoReserva,
  eliminarReserva
} from '../controllers/reservaController.js';

import {
  validarIdReserva,
  validarEstadoReserva
} from '../middleware/validarReserva.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Solo los administradores crean, editan, cambian estado o eliminan reservas
const ROLES_GESTION_RESERVAS = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL];
const soloAdministradores = [authenticate, authorizeRoles(...ROLES_GESTION_RESERVAS)];

// ===== Lectura pública (calendario) =====

// Listar reservas (filtros: fecha, estado, mesa, clienteRut)
router.get('/', obtenerReservas);

// Comprobar disponibilidad (debe ir ANTES de '/:id')
router.get('/disponibilidad', comprobarDisponibilidad);

// Obtener una reserva
router.get('/:id', validarIdReserva, obtenerReservaPorId);

// ===== Escritura: Administrador General o de Local =====

// Crear una reserva
router.post('/', ...soloAdministradores, crearReserva);

// Editar una reserva (solo los campos enviados)
router.put('/:id', ...soloAdministradores, validarIdReserva, actualizarReserva);

// Cambiar solo el estado de una reserva
router.patch(
  '/:id/estado',
  ...soloAdministradores,
  validarIdReserva,
  validarEstadoReserva,
  cambiarEstadoReserva
);

// Eliminar una reserva
router.delete('/:id', ...soloAdministradores, validarIdReserva, eliminarReserva);

export default router;
