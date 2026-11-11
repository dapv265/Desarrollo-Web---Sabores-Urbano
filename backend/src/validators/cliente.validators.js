const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const RUT_PATTERN = /^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-[\dkK]$/;

function telefonoValido(value) {
  return PHONE_PATTERN.test(value) && value.replace(/\D/g, "").length >= 8;
}

const clienteCreateValidators = [
  body("nombre")
    .isString()
    .withMessage("El nombre es obligatorio.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("telefono")
    .isString()
    .withMessage("El teléfono es obligatorio.")
    .bail()
    .trim()
    .custom(telefonoValido)
    .withMessage("Ingrese un teléfono válido."),
  body("email")
    .isString()
    .trim()
    .matches(EMAIL_PATTERN)
    .withMessage("Ingrese un correo electrónico válido."),
  body("rut")
    .isString()
    .trim()
    .matches(RUT_PATTERN)
    .withMessage("Ingrese un RUT con formato válido."),
  body("ultimaReserva")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 40 })
    .withMessage("La última reserva no puede superar 40 caracteres."),
  body("estado")
    .optional()
    .isIn(["Activo", "Inactivo"])
    .withMessage("El estado debe ser Activo o Inactivo."),
  body("restaurante")
    .optional()
    .custom((value) => value === null || mongoose.isValidObjectId(value))
    .withMessage("El restaurante debe ser un identificador válido."),
];

const clienteUpdateValidators = [
  body("nombre")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("telefono")
    .optional()
    .isString()
    .bail()
    .trim()
    .custom(telefonoValido)
    .withMessage("Ingrese un teléfono válido."),
  body("email")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(EMAIL_PATTERN)
    .withMessage("Ingrese un correo electrónico válido."),
  body("rut")
    .optional()
    .isString()
    .bail()
    .trim()
    .matches(RUT_PATTERN)
    .withMessage("Ingrese un RUT con formato válido."),
  body("ultimaReserva")
    .optional()
    .isString()
    .bail()
    .trim()
    .isLength({ max: 40 })
    .withMessage("La última reserva no puede superar 40 caracteres."),
  body("estado")
    .optional()
    .isIn(["Activo", "Inactivo"])
    .withMessage("El estado debe ser Activo o Inactivo."),
  body("restaurante")
    .optional()
    .custom((value) => value === null || mongoose.isValidObjectId(value))
    .withMessage("El restaurante debe ser un identificador válido."),
];

const clienteIdValidators = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("El id del cliente debe ser un entero positivo."),
];

module.exports = {
  clienteCreateValidators,
  clienteUpdateValidators,
  clienteIdValidators,
};
