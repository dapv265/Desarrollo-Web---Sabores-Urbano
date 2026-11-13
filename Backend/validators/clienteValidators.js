import { body, param } from 'express-validator';
import mongoose from 'mongoose';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const RUT_PATTERN = /^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-[\dkK]$/;

function telefonoValido(value) {
  return PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= 8;
}

function buildClienteBodyValidators(isUpdate = false) {
  const maybeOptional = (chain) => (isUpdate ? chain.optional() : chain);

  return [
    maybeOptional(
      body('nombre')
        .isString()
        .withMessage('El nombre es obligatorio.')
        .bail(),
    )
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    maybeOptional(
      body('telefono')
        .isString()
        .withMessage('El teléfono es obligatorio.')
        .bail(),
    )
      .trim()
      .custom(telefonoValido)
      .withMessage('Ingrese un teléfono válido.'),
    maybeOptional(body('email').isString().bail())
      .trim()
      .matches(EMAIL_PATTERN)
      .withMessage('Ingrese un correo electrónico válido.'),
    maybeOptional(body('rut').isString().bail())
      .trim()
      .matches(RUT_PATTERN)
      .withMessage('Ingrese un RUT con formato válido.'),
    body('ultimaReserva')
      .optional()
      .isString()
      .bail()
      .trim()
      .isLength({ max: 40 })
      .withMessage('La última reserva no puede superar 40 caracteres.'),
    body('estado')
      .optional()
      .isIn(['Activo', 'Inactivo'])
      .withMessage('El estado debe ser Activo o Inactivo.'),
    body('restaurante')
      .optional()
      .custom((value) => value === null || mongoose.isValidObjectId(value))
      .withMessage('El restaurante debe ser un identificador válido.'),
  ];
}

export const clienteCreateValidators = buildClienteBodyValidators(false);
export const clienteUpdateValidators = buildClienteBodyValidators(true);

export const clienteIdValidators = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id del cliente debe ser un entero positivo.'),
];
