import { body } from 'express-validator';

import { ESTADOS_RESTAURANTE } from '../models/Restaurante.js';

const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const CODIGO_PATTERN = /^[A-Za-z0-9-]+$/;

function telefonoValido(value) {
  return PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= 8;
}

function buildRestauranteBodyValidators(isUpdate = false) {
  const maybeOptional = (chain) => (isUpdate ? chain.optional() : chain);

  return [
    maybeOptional(
      body('codigo')
        .isString()
        .withMessage('El código del restaurante es obligatorio.')
        .bail(),
    )
      .trim()
      .toUpperCase()
      .isLength({ min: 2, max: 20 })
      .withMessage('El código debe tener entre 2 y 20 caracteres.')
      .matches(CODIGO_PATTERN)
      .withMessage(
        'El código solo puede contener letras, números y guiones (ej: LOC-01).',
      ),
    maybeOptional(
      body('nombre')
        .isString()
        .withMessage('El nombre del restaurante es obligatorio.')
        .bail(),
    )
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage('El nombre debe tener entre 2 y 120 caracteres.'),
    maybeOptional(
      body('direccion')
        .isString()
        .withMessage('La dirección es obligatoria.')
        .bail(),
    )
      .trim()
      .isLength({ min: 4, max: 200 })
      .withMessage('La dirección debe tener entre 4 y 200 caracteres.'),
    maybeOptional(
      body('telefono')
        .isString()
        .withMessage('El teléfono es obligatorio.')
        .bail(),
    )
      .trim()
      .custom(telefonoValido)
      .withMessage('Ingrese un teléfono válido.'),
    maybeOptional(
      body('horario')
        .isString()
        .withMessage('El horario es obligatorio.')
        .bail(),
    )
      .trim()
      .isLength({ min: 3, max: 80 })
      .withMessage('El horario debe tener entre 3 y 80 caracteres.'),
    maybeOptional(
      body('capacidadMesas').exists({ values: 'null' }).withMessage(
        'La capacidad de mesas es obligatoria.',
      ),
    )
      .isInt({ min: 1 })
      .withMessage('La capacidad de mesas debe ser un entero mayor o igual a 1.')
      .toInt(),
    body('estado')
      .optional()
      .isIn(ESTADOS_RESTAURANTE)
      .withMessage(
        `El estado debe ser uno de: ${ESTADOS_RESTAURANTE.join(', ')}.`,
      ),
  ];
}

export const restauranteCreateValidators = buildRestauranteBodyValidators(false);
export const restauranteUpdateValidators = buildRestauranteBodyValidators(true);
