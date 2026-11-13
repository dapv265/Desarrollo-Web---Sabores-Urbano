import mongoose from 'mongoose';

import { PERIODO_PATTERN } from '../models/Reporte.js';

export const validarIdReporte = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de ID de reporte no válido.',
    });
  }

  return next();
};

export const validarFiltrosReporte = (req, res, next) => {
  const { periodo, restaurante } = req.query;

  if (periodo !== undefined && periodo !== '') {
    if (typeof periodo !== 'string' || !PERIODO_PATTERN.test(periodo.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El filtro de período debe tener el formato AAAA-MM (ej: 2026-10).',
      });
    }
  }

  if (restaurante !== undefined && restaurante !== '') {
    if (
      typeof restaurante !== 'string' ||
      !mongoose.isValidObjectId(restaurante) ||
      !/^[0-9a-fA-F]{24}$/.test(restaurante)
    ) {
      return res.status(400).json({
        success: false,
        message: 'El filtro de restaurante debe ser un identificador válido.',
      });
    }
  }

  return next();
};
