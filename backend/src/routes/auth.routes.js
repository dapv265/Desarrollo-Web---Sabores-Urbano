const { Router } = require("express");

const { login, perfil, register } = require("../controllers/auth.controller");
const { ROLES } = require("../constants/roles");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  loginValidators,
  registerValidators,
} = require("../validators/auth.validators");

const router = Router();

router.post(
  "/register",
  authenticate,
  authorizeRoles(ROLES.ADMIN_GENERAL),
  registerValidators,
  validateRequest,
  register,
);
router.post("/login", loginValidators, validateRequest, login);
router.get("/perfil", authenticate, perfil);

module.exports = router;
