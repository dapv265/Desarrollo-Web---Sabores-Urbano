const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const errors = validationResult(req)
    .array()
    .map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    }));

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "La solicitud contiene datos inválidos.",
      errors,
    });
  }

  return next();
}

module.exports = { validateRequest };
