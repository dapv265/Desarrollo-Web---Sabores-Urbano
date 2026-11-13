import { Router } from 'express';

import {
  actualizarReporte,
  crearReporte,
  eliminarReporte,
  listarReportes,
  obtenerReportePorId,
  obtenerResumenReportes,
} from '../controllers/reporteController.js';
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

router.get('/', validarFiltrosReporte, listarReportes);
router.get('/resumen', validarFiltrosReporte, obtenerResumenReportes);
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
