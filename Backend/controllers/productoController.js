import { Producto } from '../models/Producto.js';
import { categoriasIniciales } from '../seeds/seedProductos.js';

const CAMPOS_EDITABLES = [
  'nombre',
  'descripcion',
  'categoriaId',
  'imagen',
  'tiempoPreparacion',
  'disponible',
  'destacado'
];

const responderError = (res, error, mensaje) => {
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ mensaje, error: error.message });
};

const tomarCampos = (body, campos) =>
  Object.fromEntries(
    campos.filter((campo) => body[campo] !== undefined).map((campo) => [campo, body[campo]])
  );

// Categorías fijas del menú
export const obtenerCategorias = (req, res) => {
  res.status(200).json(categoriasIniciales);
};

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ id: 1 });
    res.status(200).json(productos);
  } catch (error) {
    responderError(res, error, 'Error al obtener los productos');
  }
};

export const crearProducto = async (req, res) => {
  try {
    const ultimo = await Producto.findOne().sort({ id: -1 }).select('id');
    const producto = await Producto.create({
      ...tomarCampos(req.body, CAMPOS_EDITABLES),
      precio: req.body.precio,
      id: (ultimo?.id || 0) + 1
    });

    res.status(201).json(producto);
  } catch (error) {
    responderError(res, error, 'Error al crear el producto');
  }
};

// Edita los datos del producto; el precio se cambia con PATCH /:id/precio
export const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findOneAndUpdate(
      { id: Number(req.params.id) },
      tomarCampos(req.body, CAMPOS_EDITABLES),
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    responderError(res, error, 'Error al actualizar el producto');
  }
};

// Cambia el precio y guarda el cambio en el historial.
// Los pedidos ya creados conservan el precio con el que se vendieron.
export const cambiarPrecioProducto = async (req, res) => {
  try {
    const precioNuevo = Number(req.body.precio);

    if (!Number.isFinite(precioNuevo) || precioNuevo <= 0) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número mayor a 0' });
    }

    const producto = await Producto.findOne({ id: Number(req.params.id) });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    if (producto.precio !== precioNuevo) {
      producto.historialPrecios.push({
        precioAnterior: producto.precio,
        precioNuevo,
        motivo: req.body.motivo || ''
      });
      producto.precio = precioNuevo;
      await producto.save();
    }

    res.status(200).json(producto);
  } catch (error) {
    responderError(res, error, 'Error al cambiar el precio');
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findOneAndDelete({ id: Number(req.params.id) });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    responderError(res, error, 'Error al eliminar el producto');
  }
};
