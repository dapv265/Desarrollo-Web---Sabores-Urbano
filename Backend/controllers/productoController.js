import { Producto, COLACION_NOMBRE } from '../models/Producto.js';
import { Pedido, ESTADOS_PEDIDO_ABIERTO } from '../models/Pedido.js';
import { CATEGORIAS_MENU, IDS_CATEGORIAS, buscarCategoria } from '../constants/categorias.js';

// Campos que se aceptan al crear o editar (el precio se valida aparte)
const CAMPOS_EDITABLES = [
  'nombre',
  'descripcion',
  'categoriaId',
  'imagen',
  'tiempoPreparacion',
  'disponible',
  'destacado'
];

// Límites del producto (los mismos que valida el modelo)
const LIMITES = Object.freeze({
  nombreMin: 2,
  nombreMax: 80,
  descripcionMax: 300,
  imagenMax: 500,
  tiempoMin: 0,
  tiempoMax: 180
});

// Error de negocio con código HTTP y cuerpo JSON
class ErrorProducto extends Error {
  constructor(status, cuerpo) {
    super(cuerpo.mensaje);
    this.status = status;
    this.cuerpo = cuerpo;
  }
}

// Convierte los errores en respuestas JSON con { mensaje, errores[] }
const responderError = (res, error, mensaje) => {
  if (error instanceof ErrorProducto) {
    return res.status(error.status).json(error.cuerpo);
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos del producto no válidos',
      errores: Object.values(error.errors).map((detalle) =>
        detalle.name === 'CastError'
          ? `El campo ${detalle.path} tiene un valor no válido`
          : detalle.message
      )
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      mensaje: 'Datos del producto no válidos',
      errores: [`El campo ${error.path} tiene un valor no válido`]
    });
  }

  if (error.code === 11000) {
    const campo = Object.keys(error.keyPattern ?? {})[0];

    return res.status(409).json({
      mensaje: campo === 'nombre'
        ? 'Ya existe un producto con ese nombre'
        : 'No se pudo asignar un id al producto, intenta nuevamente',
      errores: []
    });
  }

  res.status(500).json({ mensaje, error: error.message });
};

// Escapa un texto para usarlo dentro de una expresión regular
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// true si el valor es un entero (acepta números o textos numéricos)
const esEntero = (valor) =>
  (typeof valor === 'number' || (typeof valor === 'string' && valor.trim() !== '')) &&
  Number.isInteger(Number(valor));

// Valida y normaliza los datos del body.
// esNuevo = true exige nombre, precio y categoriaId.
// Devuelve { datos, errores } con los campos ya convertidos.
const validarDatosProducto = (body, { esNuevo = false } = {}) => {
  const datos = {};
  const errores = [];
  const presente = (campo) => body[campo] !== undefined;

  // Nombre
  if (presente('nombre')) {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';

    if (nombre.length < LIMITES.nombreMin || nombre.length > LIMITES.nombreMax) {
      errores.push(`El nombre debe tener entre ${LIMITES.nombreMin} y ${LIMITES.nombreMax} caracteres`);
    } else {
      datos.nombre = nombre;
    }
  } else if (esNuevo) {
    errores.push('El nombre del producto es obligatorio');
  }

  // Descripción (opcional)
  if (presente('descripcion')) {
    if (typeof body.descripcion !== 'string') {
      errores.push('La descripción debe ser un texto');
    } else if (body.descripcion.trim().length > LIMITES.descripcionMax) {
      errores.push(`La descripción no puede superar los ${LIMITES.descripcionMax} caracteres`);
    } else {
      datos.descripcion = body.descripcion.trim();
    }
  }

  // Precio en CLP
  if (presente('precio')) {
    if (!esEntero(body.precio) || Number(body.precio) <= 0) {
      errores.push('El precio debe ser un número entero mayor a 0 (CLP)');
    } else {
      datos.precio = Number(body.precio);
    }
  } else if (esNuevo) {
    errores.push('El precio es obligatorio');
  }

  // Categoría
  if (presente('categoriaId')) {
    if (!esEntero(body.categoriaId) || !IDS_CATEGORIAS.includes(Number(body.categoriaId))) {
      errores.push(`La categoría no existe. Use una de: ${CATEGORIAS_MENU.map((c) => `${c.id} (${c.nombre})`).join(', ')}`);
    } else {
      datos.categoriaId = Number(body.categoriaId);
    }
  } else if (esNuevo) {
    errores.push('La categoría es obligatoria');
  }

  // Imagen (opcional: URL o ruta)
  if (presente('imagen')) {
    if (typeof body.imagen !== 'string') {
      errores.push('La imagen debe ser una URL o una ruta de texto');
    } else if (body.imagen.trim().length > LIMITES.imagenMax) {
      errores.push(`La ruta de la imagen no puede superar los ${LIMITES.imagenMax} caracteres`);
    } else {
      datos.imagen = body.imagen.trim();
    }
  }

  // Tiempo de preparación en minutos
  if (presente('tiempoPreparacion')) {
    const minutos = Number(body.tiempoPreparacion);

    if (!esEntero(body.tiempoPreparacion) || minutos < LIMITES.tiempoMin || minutos > LIMITES.tiempoMax) {
      errores.push(`El tiempo de preparación debe ser un entero entre ${LIMITES.tiempoMin} y ${LIMITES.tiempoMax} minutos`);
    } else {
      datos.tiempoPreparacion = minutos;
    }
  }

  // Interruptores
  for (const campo of ['disponible', 'destacado']) {
    if (presente(campo)) {
      if (typeof body[campo] !== 'boolean') {
        errores.push(`El campo ${campo} debe ser true o false`);
      } else {
        datos[campo] = body[campo];
      }
    }
  }

  return { datos, errores };
};

// Lanza 400 si hay errores de validación
const exigirSinErrores = (errores) => {
  if (errores.length > 0) {
    throw new ErrorProducto(400, { mensaje: 'Datos del producto no válidos', errores });
  }
};

// Lanza 409 si otro producto ya tiene ese nombre (sin distinguir mayúsculas)
const verificarNombreLibre = async (nombre, idActual = null) => {
  const filtro = { nombre };

  if (idActual !== null) {
    filtro.id = { $ne: idActual };
  }

  const existente = await Producto.findOne(filtro).collation(COLACION_NOMBRE).select('id nombre');

  if (existente) {
    throw new ErrorProducto(409, {
      mensaje: `Ya existe un producto llamado "${existente.nombre}"`,
      errores: []
    });
  }
};

// Busca el producto por id numérico o lanza 404
const buscarProducto = async (id) => {
  const producto = await Producto.findOne({ id: Number(id) });

  if (!producto) {
    throw new ErrorProducto(404, { mensaje: 'Producto no encontrado' });
  }

  return producto;
};

// Convierte ?disponible=true/false en booleano o lanza 400
const leerBooleano = (valor, nombre) => {
  if (valor === 'true') return true;
  if (valor === 'false') return false;

  throw new ErrorProducto(400, {
    mensaje: 'Filtro no válido',
    errores: [`El filtro ${nombre} debe ser true o false`]
  });
};

// GET /api/productos/categorias
// Categorías fijas del menú con la cantidad de productos de cada una
export const obtenerCategorias = async (req, res) => {
  try {
    const conteos = await Producto.aggregate([
      { $group: { _id: '$categoriaId', cantidad: { $sum: 1 } } }
    ]);
    const cantidadPorId = new Map(conteos.map((conteo) => [conteo._id, conteo.cantidad]));

    res.status(200).json(
      CATEGORIAS_MENU.map((categoria) => ({
        ...categoria,
        cantidad: cantidadPorId.get(categoria.id) ?? 0
      }))
    );
  } catch (error) {
    responderError(res, error, 'Error al obtener las categorías');
  }
};

// GET /api/productos
// Lista los productos. Filtros opcionales: ?categoria (id o nombre), ?disponible, ?destacado, ?busqueda
export const obtenerProductos = async (req, res) => {
  try {
    const { categoria, categoriaId, disponible, destacado, busqueda } = req.query;
    const filtros = {};
    const valorCategoria = categoria ?? categoriaId;

    if (valorCategoria !== undefined) {
      const encontrada = buscarCategoria(valorCategoria);

      if (!encontrada) {
        throw new ErrorProducto(400, {
          mensaje: 'Filtro no válido',
          errores: [`La categoría "${valorCategoria}" no existe`]
        });
      }

      filtros.categoriaId = encontrada.id;
    }

    if (disponible !== undefined) {
      filtros.disponible = leerBooleano(disponible, 'disponible');
    }

    if (destacado !== undefined) {
      filtros.destacado = leerBooleano(destacado, 'destacado');
    }

    if (typeof busqueda === 'string' && busqueda.trim() !== '') {
      const patron = new RegExp(escaparRegex(busqueda.trim()), 'i');
      filtros.$or = [{ nombre: patron }, { descripcion: patron }];
    }

    // Sin filtros responde igual que antes (lo usan Pedidos y Precios)
    const productos = await Producto.find(filtros).sort({ id: 1 });

    res.status(200).json(productos);
  } catch (error) {
    responderError(res, error, 'Error al obtener los productos');
  }
};

// GET /api/productos/:id
// Obtiene un producto por su id numérico
export const obtenerProductoPorId = async (req, res) => {
  try {
    res.status(200).json(await buscarProducto(req.params.id));
  } catch (error) {
    responderError(res, error, 'Error al obtener el producto');
  }
};

// POST /api/productos
// Crea un producto con el siguiente id numérico. Si dos se crean a la vez, reintenta una vez
export const crearProducto = async (req, res) => {
  try {
    const { datos, errores } = validarDatosProducto(req.body ?? {}, { esNuevo: true });
    exigirSinErrores(errores);

    await verificarNombreLibre(datos.nombre);

    for (let intento = 1; intento <= 2; intento++) {
      const ultimo = await Producto.findOne().sort({ id: -1 }).select('id');

      try {
        const producto = await Producto.create({ ...datos, id: (ultimo?.id || 0) + 1 });
        return res.status(201).json(producto);
      } catch (error) {
        const choqueDeId = error.code === 11000 && error.keyPattern?.id;

        if (!choqueDeId) throw error;

        if (intento === 2) {
          throw new ErrorProducto(409, {
            mensaje: 'Otro producto se creó al mismo tiempo. Intenta nuevamente',
            errores: []
          });
        }
      }
    }
  } catch (error) {
    responderError(res, error, 'Error al crear el producto');
  }
};

// PUT /api/productos/:id
// Edita los campos enviados. Si cambia el precio, lo registra en el historial (igual que Precios)
export const actualizarProducto = async (req, res) => {
  try {
    const body = req.body ?? {};
    const { datos, errores } = validarDatosProducto(body);
    exigirSinErrores(errores);

    const camposEnviados = [...CAMPOS_EDITABLES, 'precio'].filter((campo) => campo in datos);

    if (camposEnviados.length === 0) {
      throw new ErrorProducto(400, {
        mensaje: 'Envíe al menos un campo para actualizar',
        errores: [`Campos editables: ${[...CAMPOS_EDITABLES, 'precio'].join(', ')}`]
      });
    }

    const producto = await buscarProducto(req.params.id);

    if (datos.nombre !== undefined) {
      await verificarNombreLibre(datos.nombre, producto.id);
    }

    const { precio, ...resto } = datos;
    producto.set(resto);

    if (precio !== undefined && precio !== producto.precio) {
      producto.historialPrecios.push({
        precioAnterior: producto.precio,
        precioNuevo: precio,
        motivo: typeof body.motivo === 'string' ? body.motivo.trim().slice(0, 200) : ''
      });
      producto.precio = precio;
    }

    await producto.save();

    res.status(200).json(producto);
  } catch (error) {
    responderError(res, error, 'Error al actualizar el producto');
  }
};

// PATCH /api/productos/:id/precio  (lo usa Precios; se mantiene igual)
// Cambia el precio y guarda el cambio en el historial.
// Los pedidos ya creados conservan el precio con el que se vendieron.
export const cambiarPrecioProducto = async (req, res) => {
  try {
    const precioNuevo = Number(req.body?.precio);

    if (!Number.isFinite(precioNuevo) || precioNuevo <= 0) {
      return res.status(400).json({ mensaje: 'El precio debe ser un número mayor a 0' });
    }

    const producto = await buscarProducto(req.params.id);

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

// Cambia un interruptor (disponible o destacado) del producto
const cambiarInterruptor = (campo) => async (req, res) => {
  try {
    const valor = req.body?.[campo];

    if (typeof valor !== 'boolean') {
      throw new ErrorProducto(400, {
        mensaje: 'Datos del producto no válidos',
        errores: [`Envíe { "${campo}": true } o { "${campo}": false }`]
      });
    }

    const producto = await buscarProducto(req.params.id);
    producto[campo] = valor;
    await producto.save();

    res.status(200).json(producto);
  } catch (error) {
    responderError(res, error, `Error al cambiar ${campo}`);
  }
};

// PATCH /api/productos/:id/disponibilidad  { disponible }
export const cambiarDisponibilidadProducto = cambiarInterruptor('disponible');

// PATCH /api/productos/:id/destacado  { destacado }
export const cambiarDestacadoProducto = cambiarInterruptor('destacado');

// DELETE /api/productos/:id
// No se borra si está en un pedido abierto (Pendiente, Preparando o Listo).
// Los pedidos cerrados guardan su copia del nombre y precio, así que no se ven afectados.
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await buscarProducto(req.params.id);

    const enPedidoAbierto = await Pedido.exists({
      'items.productoId': producto.id,
      estado: { $in: ESTADOS_PEDIDO_ABIERTO }
    });

    if (enPedidoAbierto) {
      throw new ErrorProducto(409, {
        mensaje: `"${producto.nombre}" está en un pedido abierto y no se puede eliminar. Márcalo como no disponible para que no se pueda pedir y elimínalo cuando el pedido se cierre.`,
        sugerencia: 'marcar-no-disponible',
        producto: { id: producto.id, nombre: producto.nombre, disponible: producto.disponible }
      });
    }

    await Producto.deleteOne({ id: producto.id });

    res.status(200).json({
      mensaje: 'Producto eliminado correctamente',
      producto
    });
  } catch (error) {
    responderError(res, error, 'Error al eliminar el producto');
  }
};
