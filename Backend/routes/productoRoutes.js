import { Router } from 'express';

import {
  obtenerCategorias,
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  cambiarPrecioProducto,
  cambiarDisponibilidadProducto,
  cambiarDestacadoProducto,
  eliminarProducto
} from '../controllers/productoController.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { validarIdProducto } from '../middleware/validarProducto.js';

const router = Router();

// Solo los administradores modifican el menú
const ROLES_GESTION_MENU = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL];
const soloAdministradores = [authenticate, authorizeRoles(...ROLES_GESTION_MENU)];

// Lectura pública (la usan Menú, Pedidos y Precios). '/categorias' va antes de '/:id'
router.get('/categorias', obtenerCategorias);
router.get('/', obtenerProductos);
router.get('/:id', validarIdProducto, obtenerProductoPorId);

// Crear, editar y eliminar: Administrador General o de Local
router.post('/', ...soloAdministradores, crearProducto);
router.put('/:id', ...soloAdministradores, validarIdProducto, actualizarProducto);
router.patch('/:id/disponibilidad', ...soloAdministradores, validarIdProducto, cambiarDisponibilidadProducto);
router.patch('/:id/destacado', ...soloAdministradores, validarIdProducto, cambiarDestacadoProducto);
router.delete('/:id', ...soloAdministradores, validarIdProducto, eliminarProducto);

// Cambio de precio: se mantiene sin token para no romper la página de Precios
router.patch('/:id/precio', validarIdProducto, cambiarPrecioProducto);

export default router;
