import { matchedData } from 'express-validator';
import mongoose from 'mongoose';

import { CATEGORIAS_MENU } from '../constants/categorias.js';
import { ROLES } from '../constants/roles.js';
import { Mesa } from '../models/Mesa.js';
import { Pedido } from '../models/Pedido.js';
import { Producto } from '../models/Producto.js';
import { PERIODO_PATTERN, Reporte } from '../models/Reporte.js';
import { Restaurante } from '../models/Restaurante.js';

const RESTAURANTE_POPULATE = 'codigo nombre direccion telefono horario capacidadMesas estado';

function construirFiltrosReporte(query) {
  const filtros = {};

  if (typeof query.periodo === 'string' && query.periodo.trim() !== '') {
    filtros.periodo = query.periodo.trim();
  }

  if (typeof query.restaurante === 'string' && query.restaurante.trim() !== '') {
    filtros.restaurante = query.restaurante.trim();
  }

  return filtros;
}

export async function listarReportes(req, res) {
  const filtros = construirFiltrosReporte(req.query);
  const reportes = await Reporte.find(filtros)
    .populate('restaurante', RESTAURANTE_POPULATE)
    .sort({ periodo: -1, createdAt: -1 });

  return res.status(200).json({
    success: true,
    total: reportes.length,
    data: reportes,
  });
}

export async function obtenerResumenReportes(req, res) {
  const filtros = construirFiltrosReporte(req.query);
  const reportes = await Reporte.find(filtros)
    .populate('restaurante', RESTAURANTE_POPULATE)
    .sort({ ventasTotales: -1 });

  const totalReportes = reportes.length;
  let ventasTotales = 0;
  let pedidosTotales = 0;
  let sumaOcupacion = 0;
  const mapaPlatos = new Map();

  for (const reporte of reportes) {
    ventasTotales += reporte.ventasTotales || 0;
    pedidosTotales += reporte.pedidosTotales || 0;
    sumaOcupacion += reporte.tasaOcupacion || 0;

    for (const plato of reporte.platosMasVendidos || []) {
      const clave = `${plato.nombre.toLowerCase()}::${plato.categoria.toLowerCase()}`;
      const acumulado = mapaPlatos.get(clave);

      if (acumulado) {
        acumulado.cantidad += plato.cantidad;
        acumulado.totalRecaudado += plato.totalRecaudado;
      } else {
        mapaPlatos.set(clave, {
          nombre: plato.nombre,
          categoria: plato.categoria,
          cantidad: plato.cantidad,
          totalRecaudado: plato.totalRecaudado,
        });
      }
    }
  }

  const ocupacionPromedio =
    totalReportes > 0
      ? Math.round((sumaOcupacion / totalReportes) * 100) / 100
      : 0;

  const topPlatos = Array.from(mapaPlatos.values())
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad || b.totalRecaudado - a.totalRecaudado,
    )
    .slice(0, 5);

  const ventasPorLocal = reportes.map((reporte) => ({
    reporteId: reporte._id,
    periodo: reporte.periodo,
    restaurante: reporte.restaurante,
    pedidosTotales: reporte.pedidosTotales,
    ventasTotales: reporte.ventasTotales,
    tasaOcupacion: reporte.tasaOcupacion,
  }));

  return res.status(200).json({
    success: true,
    data: {
      periodo: filtros.periodo || 'Todos',
      kpis: {
        totalReportes,
        ventasTotales,
        pedidosTotales,
        ocupacionPromedio,
        platoEstrella: topPlatos[0] || null,
      },
      ventasPorLocal,
      topPlatos,
    },
  });
}

export async function obtenerReportePorId(req, res) {
  const reporte = await Reporte.findById(req.params.id).populate(
    'restaurante',
    RESTAURANTE_POPULATE,
  );

  if (!reporte) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el reporte solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    data: reporte,
  });
}

export async function crearReporte(req, res) {
  const data = matchedData(req, { locations: ['body'] });

  const restauranteExiste = await Restaurante.exists({ _id: data.restaurante });
  if (!restauranteExiste) {
    return res.status(404).json({
      success: false,
      message: 'El restaurante indicado no existe.',
    });
  }

  const reporte = new Reporte(data);
  await reporte.save();
  await reporte.populate('restaurante', RESTAURANTE_POPULATE);

  return res.status(201).json({
    success: true,
    message: 'Reporte creado correctamente.',
    data: reporte,
  });
}

export async function actualizarReporte(req, res) {
  const data = matchedData(req, { locations: ['body'] });

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Indica al menos un campo válido para actualizar.',
    });
  }

  const reporte = await Reporte.findById(req.params.id);
  if (!reporte) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el reporte solicitado.',
    });
  }

  if (data.restaurante) {
    const restauranteExiste = await Restaurante.exists({
      _id: data.restaurante,
    });
    if (!restauranteExiste) {
      return res.status(404).json({
        success: false,
        message: 'El restaurante indicado no existe.',
      });
    }
  }

  Object.assign(reporte, data);
  await reporte.save();
  await reporte.populate('restaurante', RESTAURANTE_POPULATE);

  return res.status(200).json({
    success: true,
    message: 'Reporte actualizado correctamente.',
    data: reporte,
  });
}

export async function eliminarReporte(req, res) {
  const reporte = await Reporte.findByIdAndDelete(req.params.id).populate(
    'restaurante',
    RESTAURANTE_POPULATE,
  );

  if (!reporte) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el reporte solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Reporte eliminado correctamente.',
    data: reporte,
  });
}

function periodoActual() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

// POST /api/reportes/generar  { periodo?: 'AAAA-MM', restaurante?: ObjectId }
// Calcula y guarda (upsert) reportes reales a partir de los pedidos por mesa del período.
export async function generarReportesDesdePedidos(req, res) {
  const periodoInput =
    typeof req.body?.periodo === 'string' && req.body.periodo.trim() !== ''
      ? req.body.periodo.trim()
      : periodoActual();

  if (!PERIODO_PATTERN.test(periodoInput)) {
    return res.status(400).json({
      success: false,
      message: 'El período debe tener el formato AAAA-MM (ej: 2026-11).',
    });
  }

  const esAdminLocal = req.user?.rol === ROLES.ADMIN_LOCAL;
  const restauranteSolicitado = esAdminLocal
    ? String(req.user?.restaurante?._id || req.user?.restaurante || '')
    : typeof req.body?.restaurante === 'string' &&
        req.body.restaurante.trim() !== '' &&
        req.body.restaurante !== 'Todos'
      ? req.body.restaurante.trim()
      : null;

  if (restauranteSolicitado && !mongoose.isValidObjectId(restauranteSolicitado)) {
    return res.status(400).json({
      success: false,
      message: 'El identificador del restaurante no es válido.',
    });
  }

  const restaurantesObjetivo = restauranteSolicitado
    ? await Restaurante.find({ _id: restauranteSolicitado })
    : await Restaurante.find({}).sort({ codigo: 1 });

  if (restaurantesObjetivo.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No se encontraron restaurantes para generar el reporte.',
    });
  }

  const [anio, mes] = periodoInput.split('-').map(Number);
  const desde = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0));
  const hasta = new Date(Date.UTC(anio, mes, 1, 0, 0, 0));

  const [productos, todasLasMesas, pedidosPeriodo] = await Promise.all([
    Producto.find({}).select('id categoriaId').lean(),
    Mesa.find({}).select('id restauranteCodigo').lean(),
    Pedido.find({
      estado: { $ne: 'Cancelado' },
      createdAt: { $gte: desde, $lt: hasta },
    }).lean(),
  ]);

  const nombresCategoria = new Map(CATEGORIAS_MENU.map((c) => [c.id, c.nombre]));
  const categoriaPorProductoId = new Map(
    productos.map((p) => [p.id, nombresCategoria.get(p.categoriaId) || 'General']),
  );
  const codigoPorMesaId = new Map(
    todasLasMesas.map((m) => [m.id, m.restauranteCodigo || null]),
  );

  const generados = [];
  let totalPedidosAnalizados = 0;

  for (const restaurante of restaurantesObjetivo) {
    const mesasDelLocal = todasLasMesas.filter(
      (m) => m.restauranteCodigo === restaurante.codigo,
    );

    const pedidosDelLocal = pedidosPeriodo.filter((pedido) => {
      const codigoEfectivo =
        pedido.restauranteCodigo || codigoPorMesaId.get(pedido.mesaId) || null;
      if (codigoEfectivo) {
        return codigoEfectivo === restaurante.codigo;
      }
      // Pedidos en mesas aún sin sucursal asignada se consolidan en LOC-01 o en el único local seleccionado
      return (
        restaurantesObjetivo.length === 1 || restaurante.codigo === 'LOC-01'
      );
    });

    totalPedidosAnalizados += pedidosDelLocal.length;

    let ventasTotales = 0;
    const mesasAtendidas = new Set();
    const mapaPlatos = new Map();

    for (const pedido of pedidosDelLocal) {
      if (pedido.mesaId) {
        mesasAtendidas.add(pedido.mesaId);
      }

      for (const item of pedido.items || []) {
        const cantidad = Number(item.cantidad) || 0;
        const precioUnitario = Number(item.precio) || 0;
        const subtotal = cantidad * precioUnitario;
        ventasTotales += subtotal;

        if (cantidad <= 0 || !item.nombre) continue;

        const categoria =
          categoriaPorProductoId.get(item.productoId) || 'General';
        const clave = `${item.nombre.toLowerCase()}::${categoria.toLowerCase()}`;
        const acumulado = mapaPlatos.get(clave);

        if (acumulado) {
          acumulado.cantidad += cantidad;
          acumulado.totalRecaudado += subtotal;
        } else {
          mapaPlatos.set(clave, {
            nombre: item.nombre,
            categoria,
            cantidad,
            totalRecaudado: subtotal,
          });
        }
      }
    }

    const baseMesas = mesasDelLocal.length || restaurante.capacidadMesas || 1;
    const tasaOcupacion =
      pedidosDelLocal.length === 0
        ? 0
        : Math.min(100, Math.round((mesasAtendidas.size / baseMesas) * 100));

    const platosMasVendidos = Array.from(mapaPlatos.values())
      .sort(
        (a, b) =>
          b.cantidad - a.cantidad || b.totalRecaudado - a.totalRecaudado,
      )
      .slice(0, 10);

    const reporte = await Reporte.findOneAndUpdate(
      { periodo: periodoInput, restaurante: restaurante._id },
      {
        periodo: periodoInput,
        restaurante: restaurante._id,
        pedidosTotales: pedidosDelLocal.length,
        ventasTotales,
        tasaOcupacion,
        platosMasVendidos,
        observaciones: `Calculado automáticamente desde ${pedidosDelLocal.length} pedido(s) en ${mesasAtendidas.size} mesa(s) del período ${periodoInput}.`,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate('restaurante', RESTAURANTE_POPULATE);

    generados.push(reporte);
  }

  return res.status(200).json({
    success: true,
    message: `Reporte(s) del período ${periodoInput} calculados desde ${totalPedidosAnalizados} pedido(s).`,
    data: {
      periodo: periodoInput,
      totalPedidosAnalizados,
      reportes: generados,
    },
  });
}

// Recalcula automáticamente el reporte mensual del local cuando se cobra un pedido
export async function recalcularReporteDePedido(pedido) {
  try {
    const fechaBase = pedido?.createdAt ? new Date(pedido.createdAt) : new Date();
    const anio = fechaBase.getUTCFullYear();
    const mes = String(fechaBase.getUTCMonth() + 1).padStart(2, '0');
    const periodoInput = `${anio}-${mes}`;

    let codigoLocal = pedido?.restauranteCodigo || null;
    if (!codigoLocal && pedido?.mesaId) {
      const mesa = await Mesa.findOne({ id: pedido.mesaId })
        .select('restauranteCodigo')
        .lean();
      codigoLocal = mesa?.restauranteCodigo || null;
    }

    const restaurante = codigoLocal
      ? await Restaurante.findOne({ codigo: codigoLocal })
      : (await Restaurante.findOne({ codigo: 'LOC-01' })) ||
        (await Restaurante.findOne({}).sort({ codigo: 1 }));

    if (!restaurante) return null;

    const desde = new Date(Date.UTC(anio, Number(mes) - 1, 1, 0, 0, 0));
    const hasta = new Date(Date.UTC(anio, Number(mes), 1, 0, 0, 0));

    const [productos, todasLasMesas, pedidosPeriodo] = await Promise.all([
      Producto.find({}).select('id categoriaId').lean(),
      Mesa.find({}).select('id restauranteCodigo').lean(),
      Pedido.find({
        estado: { $ne: 'Cancelado' },
        createdAt: { $gte: desde, $lt: hasta },
      }).lean(),
    ]);

    const nombresCategoria = new Map(CATEGORIAS_MENU.map((c) => [c.id, c.nombre]));
    const categoriaPorProductoId = new Map(
      productos.map((p) => [p.id, nombresCategoria.get(p.categoriaId) || 'General']),
    );
    const codigoPorMesaId = new Map(
      todasLasMesas.map((m) => [m.id, m.restauranteCodigo || null]),
    );
    const mesasDelLocal = todasLasMesas.filter(
      (m) => m.restauranteCodigo === restaurante.codigo,
    );

    const pedidosDelLocal = pedidosPeriodo.filter((item) => {
      const codigoEfectivo =
        item.restauranteCodigo || codigoPorMesaId.get(item.mesaId) || null;
      if (codigoEfectivo) {
        return codigoEfectivo === restaurante.codigo;
      }
      return restaurante.codigo === 'LOC-01';
    });

    let ventasTotales = 0;
    const mesasAtendidas = new Set();
    const mapaPlatos = new Map();

    for (const p of pedidosDelLocal) {
      if (p.mesaId) mesasAtendidas.add(p.mesaId);

      for (const item of p.items || []) {
        const cantidad = Number(item.cantidad) || 0;
        const precioUnitario = Number(item.precio) || 0;
        const subtotal = cantidad * precioUnitario;
        ventasTotales += subtotal;

        if (cantidad <= 0 || !item.nombre) continue;

        const categoria =
          categoriaPorProductoId.get(item.productoId) || 'General';
        const clave = `${item.nombre.toLowerCase()}::${categoria.toLowerCase()}`;
        const acumulado = mapaPlatos.get(clave);

        if (acumulado) {
          acumulado.cantidad += cantidad;
          acumulado.totalRecaudado += subtotal;
        } else {
          mapaPlatos.set(clave, {
            nombre: item.nombre,
            categoria,
            cantidad,
            totalRecaudado: subtotal,
          });
        }
      }
    }

    const baseMesas = mesasDelLocal.length || restaurante.capacidadMesas || 1;
    const tasaOcupacion =
      pedidosDelLocal.length === 0
        ? 0
        : Math.min(100, Math.round((mesasAtendidas.size / baseMesas) * 100));

    const platosMasVendidos = Array.from(mapaPlatos.values())
      .sort(
        (a, b) =>
          b.cantidad - a.cantidad || b.totalRecaudado - a.totalRecaudado,
      )
      .slice(0, 10);

    return await Reporte.findOneAndUpdate(
      { periodo: periodoInput, restaurante: restaurante._id },
      {
        periodo: periodoInput,
        restaurante: restaurante._id,
        pedidosTotales: pedidosDelLocal.length,
        ventasTotales,
        tasaOcupacion,
        platosMasVendidos,
        observaciones: `Actualizado automáticamente desde ${pedidosDelLocal.length} pedido(s) en ${mesasAtendidas.size} mesa(s) del período ${periodoInput}.`,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    console.error('Error al recalcular reporte tras cobro de pedido:', error);
    return null;
  }
}
