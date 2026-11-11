const { Router } = require("express");

const {
  actualizar,
  crear,
  eliminar,
  listar,
  obtenerPorId,
} = require("../controllers/cliente.controller");
const { ROLES_GESTION_CLIENTES, ROLES_CONSULTA_CLIENTES } = require("../constants/roles");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  clienteCreateValidators,
  clienteIdValidators,
  clienteUpdateValidators,
} = require("../validators/cliente.validators");

const router = Router();

router.get(
  "/",
  authenticate,
  authorizeRoles(...ROLES_CONSULTA_CLIENTES),
  listar,
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles(...ROLES_CONSULTA_CLIENTES),
  clienteIdValidators,
  validateRequest,
  obtenerPorId,
);
router.post(
  "/",
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  clienteCreateValidators,
  validateRequest,
  crear,
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  [...clienteIdValidators, ...clienteUpdateValidators],
  validateRequest,
  actualizar,
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(...ROLES_GESTION_CLIENTES),
  clienteIdValidators,
  validateRequest,
  eliminar,
);

module.exports = router;
