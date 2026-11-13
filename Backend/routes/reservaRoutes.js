
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

const router = Router();

// Listar reservas (filtros: fecha, estado, mesa, clienteRut)
router.get('/', obtenerReservas);

// Comprobar disponibilidad (debe ir ANTES de '/:id')
router.get('/disponibilidad', comprobarDisponibilidad);

// Obtener una reserva
router.get('/:id', validarIdReserva, obtenerReservaPorId);

// Crear una reserva
router.post('/', crearReserva);

// Editar una reserva (solo los campos enviados)
router.put('/:id', validarIdReserva, actualizarReserva);

// Cambiar solo el estado de una reserva
router.patch(
  '/:id/estado',
  validarIdReserva,
  validarEstadoReserva,
  cambiarEstadoReserva
);

// Eliminar una reserva
router.delete('/:id', validarIdReserva, eliminarReserva);

export default router;
