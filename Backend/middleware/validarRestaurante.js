import mongoose from 'mongoose';

import { ESTADOS_RESTAURANTE } from '../models/Restaurante.js';

const CODIGO_PATTERN = /^[A-Za-z0-9-]+$/;

export const validarIdRestaurante = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de ID de restaurante no válido.',
    });
  }

  return next();
};

export const validarCodigoRestaurante = (req, res, next) => {
  const codigo = typeof req.params.codigo === 'string'
    ? req.params.codigo.trim().toUpperCase()
    : '';

  if (codigo.length < 2 || codigo.length > 20 || !CODIGO_PATTERN.test(codigo)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de código de restaurante no válido.',
    });
  }

  req.params.codigo = codigo;
  return next();
};

export const validarEstadoRestaurante = (req, res, next) => {
  const { estado } = req.body ?? {};

  if (!ESTADOS_RESTAURANTE.includes(estado)) {
    return res.status(400).json({
      success: false,
      message: 'Estado de restaurante no válido.',
      estadosPermitidos: ESTADOS_RESTAURANTE,
    });
  }

  return next();
};

export const validarFiltroEstadoRestaurante = (req, res, next) => {
  const { estado } = req.query;

  if (estado !== undefined && estado !== '' && !ESTADOS_RESTAURANTE.includes(estado)) {
    return res.status(400).json({
      success: false,
      message: 'El filtro de estado no es válido.',
      estadosPermitidos: ESTADOS_RESTAURANTE,
    });
  }

  return next();
};
