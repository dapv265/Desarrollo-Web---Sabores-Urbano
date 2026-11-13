import { matchedData } from 'express-validator';

import { Reporte } from '../models/Reporte.js';
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
