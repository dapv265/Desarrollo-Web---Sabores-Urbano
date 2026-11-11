function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    const duplicateFields = Object.keys(error.keyPattern || error.keyValue || {});
    let message = "Ya existe un registro con esos datos.";

    if (duplicateFields.includes("email")) {
      message = "El correo electrónico ya está registrado.";
    } else if (duplicateFields.includes("rut")) {
      message = "El RUT ya está registrado.";
    } else if (duplicateFields.includes("id")) {
      message = "Ya existe un cliente con ese identificador.";
    }

    return res.status(409).json({ success: false, message });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Los datos no cumplen las validaciones del modelo.",
      errors,
    });
  }

  if (error.name === "CastError" || error.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message:
        error.type === "entity.parse.failed"
          ? "El cuerpo de la solicitud no contiene JSON válido."
          : "Uno de los identificadores tiene un formato inválido.",
    });
  }

  console.error("Error en la solicitud HTTP:", error);
  return res.status(500).json({
    success: false,
    message: "Ocurrió un error interno.",
  });
}

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: "La ruta solicitada no existe.",
  });
}

module.exports = { errorHandler, notFound };
