import { body } from 'express-validator';
import mongoose from 'mongoose';

import { PERIODO_PATTERN } from '../models/Reporte.js';

function buildReporteBodyValidators(isUpdate = false) {
  const maybeOptional = (chain) => (isUpdate ? chain.optional() : chain);

  return [
    maybeOptional(
      body('periodo')
        .isString()
        .withMessage('El período es obligatorio.')
        .bail(),
    )
      .trim()
      .matches(PERIODO_PATTERN)
      .withMessage('El período debe tener el formato AAAA-MM (ej: 2026-10).'),
    maybeOptional(
      body('restaurante')
        .isString()
        .withMessage('El restaurante es obligatorio.')
        .bail(),
    )
      .trim()
      .custom(
        (value) =>
          mongoose.isValidObjectId(value) && /^[0-9a-fA-F]{24}$/.test(value),
      )
      .withMessage('El restaurante debe ser un identificador válido.'),
    body('pedidosTotales')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Los pedidos totales deben ser un entero mayor o igual a 0.')
      .toInt(),
    body('ventasTotales')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Las ventas totales deben ser un número mayor o igual a 0.')
      .toFloat(),
    body('tasaOcupacion')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('La tasa de ocupación debe estar entre 0 y 100.')
      .toFloat(),
    body('platosMasVendidos')
      .optional()
      .isArray()
      .withMessage('platosMasVendidos debe ser un arreglo.'),
    body('platosMasVendidos.*.nombre')
      .isString()
      .withMessage('El nombre de cada plato es obligatorio.')
      .bail()
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('El nombre del plato debe tener entre 2 y 120 caracteres.'),
    body('platosMasVendidos.*.categoria')
      .isString()
      .withMessage('La categoría de cada plato es obligatoria.')
      .bail()
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('La categoría del plato debe tener entre 2 y 60 caracteres.'),
    body('platosMasVendidos.*.cantidad')
      .isInt({ min: 1 })
      .withMessage('La cantidad de cada plato debe ser un entero positivo.')
      .toInt(),
    body('platosMasVendidos.*.totalRecaudado')
      .isFloat({ min: 0 })
      .withMessage(
        'El total recaudado de cada plato debe ser un número mayor o igual a 0.',
      )
      .toFloat(),
    body('observaciones')
      .optional()
      .isString()
      .withMessage('Las observaciones deben ser texto.')
      .bail()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Las observaciones no pueden superar los 500 caracteres.'),
  ];
}

export const reporteCreateValidators = buildReporteBodyValidators(false);
export const reporteUpdateValidators = buildReporteBodyValidators(true);
