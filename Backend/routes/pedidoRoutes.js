import { Router } from 'express';
import {
  obtenerPedidos,
  crearPedido,
  agregarProducto,
  quitarProducto,
  enviarACocina,
  cambiarEstadoPedido
} from '../controllers/pedidoController.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

const TODOS = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL, ROLES.GARZON, ROLES.COCINA];
const SALON = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL, ROLES.GARZON];

// Todas las rutas de pedidos requieren sesión
router.use(authenticate);

router.get('/', authorizeRoles(...TODOS), obtenerPedidos);

// RF9: abrir pedido (salón)
router.post('/', authorizeRoles(...SALON), crearPedido);

// RF10: productos del pedido (salón)
router.post('/:id/items', authorizeRoles(...SALON), agregarProducto);
router.delete('/:id/items/:itemId', authorizeRoles(...SALON), quitarProducto);

// Confirma la comanda: los productos sin enviar pasan a cocina
router.post('/:id/enviar', authorizeRoles(...SALON), enviarACocina);

// RF11 y cierre: cada estado valida su propio rol en el controlador
router.patch('/:id/estado', authorizeRoles(...TODOS), cambiarEstadoPedido);

// No hay DELETE de pedidos: se cancelan para conservar el historial

export default router;
