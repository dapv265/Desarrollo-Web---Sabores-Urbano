import { Router } from 'express';

import {
  actualizarReporte,
  crearReporte,
  eliminarReporte,
  generarReportesDesdePedidos,
  listarReportes,
  obtenerReportePorId,
  obtenerResumenReportes,
} from '../controllers/reporteController.js';
import { ROLES } from '../constants/roles.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  validarFiltrosReporte,
  validarIdReporte,
} from '../middleware/validarReporte.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import {
  reporteCreateValidators,
  reporteUpdateValidators,
} from '../validators/reporteValidators.js';

const router = Router();

const soloAdministradores = [
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL),
];

router.use(...soloAdministradores);

router.get('/', validarFiltrosReporte, listarReportes);
router.get('/resumen', validarFiltrosReporte, obtenerResumenReportes);
router.post('/generar', generarReportesDesdePedidos);
router.get('/:id', validarIdReporte, obtenerReportePorId);
router.post('/', reporteCreateValidators, validateRequest, crearReporte);
router.put(
  '/:id',
  validarIdReporte,
  reporteUpdateValidators,
  validateRequest,
  actualizarReporte,
);
router.delete('/:id', validarIdReporte, eliminarReporte);

export default router;
