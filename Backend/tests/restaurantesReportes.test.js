import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Reporte } from '../models/Reporte.js';
import { Restaurante } from '../models/Restaurante.js';
import { app } from '../server.js';

let mongod;
let server;
let baseUrl;

function obtenerSystemBinary() {
  const candidatos = [
    process.env.MONGOD_SYSTEM_BINARY,
    '/opt/homebrew/bin/mongod',
    '/usr/local/bin/mongod',
    '/usr/bin/mongod',
  ].filter(Boolean);

  return candidatos.find((ruta) => fs.existsSync(ruta));
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();
  return { status: response.status, data };
}

before(async () => {
  const systemBinary = obtenerSystemBinary();
  mongod = await MongoMemoryServer.create(
    systemBinary ? { binary: { systemBinary } } : undefined,
  );
  await mongoose.connect(mongod.getUri());
  await Restaurante.syncIndexes();
  await Reporte.syncIndexes();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  server?.closeAllConnections?.();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await Reporte.deleteMany({});
  await Restaurante.deleteMany({});
});

describe('API CRUD Restaurantes', () => {
  it('crea, lista, filtra, obtiene, actualiza, cambia estado y elimina un restaurante', async () => {
    const nuevo = {
      codigo: 'loc-04',
      nombre: 'Sucursal Ñuñoa',
      direccion: 'Av. Irarrázaval 2000, Ñuñoa',
      telefono: '+56 2 2333 4455',
      horario: '12:00 - 23:30',
      capacidadMesas: 16,
      estado: 'Operativo',
    };

    const creado = await request('/api/restaurantes', {
      method: 'POST',
      body: JSON.stringify(nuevo),
    });

    assert.equal(creado.status, 201);
    assert.equal(creado.data.success, true);
    assert.equal(creado.data.data.codigo, 'LOC-04');
    const id = creado.data.data._id;

    const listado = await request('/api/restaurantes?estado=Operativo&buscar=Ñuñoa');
    assert.equal(listado.status, 200);
    assert.equal(listado.data.total, 1);
    assert.equal(listado.data.data[0].nombre, 'Sucursal Ñuñoa');

    const porId = await request(`/api/restaurantes/${id}`);
    assert.equal(porId.status, 200);
    assert.equal(porId.data.data._id, id);

    const porCodigo = await request('/api/restaurantes/codigo/loc-04');
    assert.equal(porCodigo.status, 200);
    assert.equal(porCodigo.data.data.codigo, 'LOC-04');

    const actualizado = await request(`/api/restaurantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'Sucursal Ñuñoa Plaza',
        capacidadMesas: 22,
      }),
    });
    assert.equal(actualizado.status, 200);
    assert.equal(actualizado.data.data.nombre, 'Sucursal Ñuñoa Plaza');
    assert.equal(actualizado.data.data.capacidadMesas, 22);

    const cambioEstado = await request(`/api/restaurantes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'En Mantención' }),
    });
    assert.equal(cambioEstado.status, 200);
    assert.equal(cambioEstado.data.data.estado, 'En Mantención');

    const eliminado = await request(`/api/restaurantes/${id}`, {
      method: 'DELETE',
    });
    assert.equal(eliminado.status, 200);

    const despuesEliminar = await request(`/api/restaurantes/${id}`);
    assert.equal(despuesEliminar.status, 404);
  });

  it('valida datos inválidos (400) y código duplicado (409)', async () => {
    const invalido = await request('/api/restaurantes', {
      method: 'POST',
      body: JSON.stringify({
        codigo: 'X',
        nombre: 'A',
        direccion: '12',
        telefono: 'abc',
        horario: '12',
        capacidadMesas: 0,
      }),
    });
    assert.equal(invalido.status, 400);
    assert.equal(invalido.data.success, false);
    assert.ok(Array.isArray(invalido.data.errors));

    const idInvalido = await request('/api/restaurantes/no-es-objectid');
    assert.equal(idInvalido.status, 400);

    const estadoFiltroInvalido = await request('/api/restaurantes?estado=Inventado');
    assert.equal(estadoFiltroInvalido.status, 400);

    const valido = {
      codigo: 'LOC-01',
      nombre: 'Sucursal Santiago Centro',
      direccion: 'Moneda 850, Santiago',
      telefono: '+56 2 2233 4455',
      horario: '12:00 - 23:00',
      capacidadMesas: 15,
    };

    const primero = await request('/api/restaurantes', {
      method: 'POST',
      body: JSON.stringify(valido),
    });
    assert.equal(primero.status, 201);

    const duplicado = await request('/api/restaurantes', {
      method: 'POST',
      body: JSON.stringify(valido),
    });
    assert.equal(duplicado.status, 409);
    assert.match(duplicado.data.message, /código/i);
  });

  it('rechaza PUT sin campos válidos (400) y PATCH con estado inválido (400)', async () => {
    const creado = await request('/api/restaurantes', {
      method: 'POST',
      body: JSON.stringify({
        codigo: 'LOC-09',
        nombre: 'Sucursal Vitacura',
        direccion: 'Av. Vitacura 3500',
        telefono: '+56 2 2999 0000',
        horario: '12:00 - 23:00',
        capacidadMesas: 12,
      }),
    });

    const id = creado.data.data._id;

    const putVacio = await request(`/api/restaurantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ campoDesconocido: 'valor' }),
    });
    assert.equal(putVacio.status, 400);

    const patchInvalido = await request(`/api/restaurantes/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'Desconocido' }),
    });
    assert.equal(patchInvalido.status, 400);
  });
});

describe('API CRUD Reportes y Resumen', () => {
  it('crea, lista, filtra, obtiene resumen consolidado, actualiza y elimina reportes', async () => {
    const r1 = await Restaurante.create({
      codigo: 'LOC-01',
      nombre: 'Sucursal Santiago Centro',
      direccion: 'Moneda 850, Santiago',
      telefono: '+56 2 2233 4455',
      horario: '12:00 - 23:00',
      capacidadMesas: 15,
    });
    const r2 = await Restaurante.create({
      codigo: 'LOC-02',
      nombre: 'Sucursal Providencia',
      direccion: 'Av. Pedro de Valdivia 520',
      telefono: '+56 2 2244 5566',
      horario: '12:30 - 00:00',
      capacidadMesas: 20,
    });

    const rep1 = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify({
        periodo: '2026-10',
        restaurante: String(r1._id),
        pedidosTotales: 410,
        ventasTotales: 5950000,
        tasaOcupacion: 74,
        platosMasVendidos: [
          {
            nombre: 'Lomo a lo Pobre Urbano',
            categoria: 'Fondos',
            cantidad: 120,
            totalRecaudado: 1560000,
          },
          {
            nombre: 'Pastel de Choclo',
            categoria: 'Fondos',
            cantidad: 90,
            totalRecaudado: 990000,
          },
        ],
      }),
    });
    assert.equal(rep1.status, 201);
    assert.equal(rep1.data.data.restaurante.codigo, 'LOC-01');

    const rep2 = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify({
        periodo: '2026-10',
        restaurante: String(r2._id),
        pedidosTotales: 520,
        ventasTotales: 8200000,
        tasaOcupacion: 86,
        platosMasVendidos: [
          {
            nombre: 'Lomo a lo Pobre Urbano',
            categoria: 'Fondos',
            cantidad: 180,
            totalRecaudado: 2340000,
          },
        ],
      }),
    });
    assert.equal(rep2.status, 201);

    const listado = await request('/api/reportes?periodo=2026-10');
    assert.equal(listado.status, 200);
    assert.equal(listado.data.total, 2);

    const porRestaurante = await request(`/api/reportes?restaurante=${r1._id}`);
    assert.equal(porRestaurante.status, 200);
    assert.equal(porRestaurante.data.total, 1);

    const resumen = await request('/api/reportes/resumen?periodo=2026-10');
    assert.equal(resumen.status, 200);
    assert.equal(resumen.data.data.kpis.totalReportes, 2);
    assert.equal(resumen.data.data.kpis.pedidosTotales, 930);
    assert.equal(resumen.data.data.kpis.ventasTotales, 14150000);
    assert.equal(resumen.data.data.kpis.ocupacionPromedio, 80);
    assert.equal(resumen.data.data.kpis.platoEstrella.nombre, 'Lomo a lo Pobre Urbano');
    assert.equal(resumen.data.data.kpis.platoEstrella.cantidad, 300);
    assert.equal(resumen.data.data.ventasPorLocal[0].restaurante.codigo, 'LOC-02');

    const reporteId = rep1.data.data._id;
    const porId = await request(`/api/reportes/${reporteId}`);
    assert.equal(porId.status, 200);
    assert.equal(porId.data.data._id, reporteId);

    const actualizado = await request(`/api/reportes/${reporteId}`, {
      method: 'PUT',
      body: JSON.stringify({
        pedidosTotales: 430,
        tasaOcupacion: 78,
        observaciones: 'Cierre revisado',
      }),
    });
    assert.equal(actualizado.status, 200);
    assert.equal(actualizado.data.data.pedidosTotales, 430);
    assert.equal(actualizado.data.data.observaciones, 'Cierre revisado');

    const eliminado = await request(`/api/reportes/${reporteId}`, {
      method: 'DELETE',
    });
    assert.equal(eliminado.status, 200);

    const yaNoExiste = await request(`/api/reportes/${reporteId}`);
    assert.equal(yaNoExiste.status, 404);
  });

  it('valida errores de negocio y formato en reportes (400, 404, 409)', async () => {
    const restaurante = await Restaurante.create({
      codigo: 'LOC-01',
      nombre: 'Sucursal Santiago Centro',
      direccion: 'Moneda 850, Santiago',
      telefono: '+56 2 2233 4455',
      horario: '12:00 - 23:00',
      capacidadMesas: 15,
    });

    const periodoInvalido = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify({
        periodo: '2026-13',
        restaurante: String(restaurante._id),
        pedidosTotales: -1,
        tasaOcupacion: 150,
      }),
    });
    assert.equal(periodoInvalido.status, 400);

    const filtroInvalido = await request('/api/reportes?periodo=octubre');
    assert.equal(filtroInvalido.status, 400);

    const idInvalido = await request('/api/reportes/id-malo');
    assert.equal(idInvalido.status, 400);

    const restauranteInexistente = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify({
        periodo: '2026-10',
        restaurante: '672000000000000000009999',
        pedidosTotales: 10,
        ventasTotales: 100000,
        tasaOcupacion: 50,
      }),
    });
    assert.equal(restauranteInexistente.status, 404);

    const payload = {
      periodo: '2026-10',
      restaurante: String(restaurante._id),
      pedidosTotales: 10,
      ventasTotales: 100000,
      tasaOcupacion: 50,
    };

    const primero = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert.equal(primero.status, 201);

    const duplicado = await request('/api/reportes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    assert.equal(duplicado.status, 409);
    assert.match(duplicado.data.message, /Ya existe un reporte/i);
  });
});
