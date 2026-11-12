
const estadosPermitidos = [
  'disponible',
  'reservada',
  'ocupada',
  'limpieza',
  'fuera'
];

export const validarEstadoMesa = (req, res, next) => {
  const { estado } = req.body ?? {};

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado de mesa no válido',
      estadosPermitidos
    });
  }

  next();
};

export const validarIdMesa = (req, res, next) => {
  const { id } = req.params;

  if (!/^[A-Za-z]-\d{2}$/.test(id)) {
    return res.status(400).json({
      mensaje: 'Formato de ID de mesa no válido'
    });
  }

  next();
};
