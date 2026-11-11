const { body } = require("express-validator");
const mongoose = require("mongoose");

const { ROLES, ROLES_LOCALES } = require("../constants/roles");

const loginValidators = [
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Ingrese un correo electrónico válido."),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("La contraseña es obligatoria."),
];

const registerValidators = [
  body("nombre")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Ingrese un correo electrónico válido."),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("La contraseña debe tener entre 8 y 128 caracteres."),
  body("rol")
    .isIn(Object.values(ROLES))
    .withMessage("El rol indicado no es válido."),
  body("restaurante").custom((value, { req }) => {
    if (req.body.rol === ROLES.ADMIN_GENERAL) {
      if (value !== undefined && value !== null && value !== "") {
        throw new Error("El Administrador General no debe tener un restaurante.");
      }

      return true;
    }

    if (ROLES_LOCALES.includes(req.body.rol)) {
      if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
        throw new Error("Este rol requiere un restaurante válido.");
      }
    }

    return true;
  }),
];

module.exports = { loginValidators, registerValidators };
