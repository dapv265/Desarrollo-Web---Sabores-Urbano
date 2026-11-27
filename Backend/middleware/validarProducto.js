// Valida que el :id de la URL sea el id numérico del producto (entero positivo)
export const validarIdProducto = (req, res, next) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id) || Number(id) < 1) {
    return res.status(400).json({
      mensaje: 'El id del producto debe ser un número entero positivo',
      errores: [`"${id}" no es un id de producto válido`]
    });
  }

  next();
};
