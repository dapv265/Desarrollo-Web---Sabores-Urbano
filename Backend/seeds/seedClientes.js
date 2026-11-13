import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { connectDB } from '../config/db.js';
import { ROLES } from '../constants/roles.js';
import { Cliente } from '../models/Cliente.js';
import { Restaurante } from '../models/Restaurante.js';
import { Usuario } from '../models/Usuario.js';

dotenv.config();

const DEVELOPMENT_PASSWORD = 'SaboresDev2026!';

const RESTAURANTES_BASE = [
  {
    _id: '672000000000000000000001',
    codigo: 'LOC-01',
    nombre: 'Sucursal Santiago Centro',
    direccion: 'Moneda 850, Santiago',
    telefono: '+56 2 2233 4455',
    horario: '12:00 - 23:00',
    capacidadMesas: 15,
    estado: 'Operativo',
  },
  {
    _id: '672000000000000000000002',
    codigo: 'LOC-02',
    nombre: 'Sucursal Providencia',
    direccion: 'Av. Pedro de Valdivia 520, Providencia',
    telefono: '+56 2 2244 5566',
    horario: '12:30 - 00:00',
    capacidadMesas: 20,
    estado: 'Operativo',
  },
  {
    _id: '672000000000000000000003',
    codigo: 'LOC-03',
    nombre: 'Sucursal Las Condes',
    direccion: 'Av. Apoquindo 4800, Las Condes',
    telefono: '+56 2 2255 6677',
    horario: '12:00 - 23:30',
    capacidadMesas: 18,
    estado: 'En Mantención',
  },
];

const CLIENTES_SEED = [
  {
    id: 1,
    nombre: 'Juan Pérez',
    telefono: '+56 9 1234 5678',
    email: 'juan.perez@email.com',
    rut: '12.345.678-9',
    ultimaReserva: '2026-10-01',
    estado: 'Activo',
    codigoRestaurante: 'LOC-01',
  },
  {
    id: 2,
    nombre: 'María González',
    telefono: '+56 9 8765 4321',
    email: 'maria.gonzalez@email.com',
    rut: '19.876.543-2',
    ultimaReserva: '2026-10-05',
    estado: 'Activo',
    codigoRestaurante: 'LOC-02',
  },
  {
    id: 3,
    nombre: 'Carlos Soto',
    telefono: '+56 9 5555 4444',
    email: 'carlos.soto@email.com',
    rut: '15.444.333-K',
    ultimaReserva: '2026-09-15',
    estado: 'Inactivo',
    codigoRestaurante: 'LOC-03',
  },
  {
    id: 4,
    nombre: 'Ana Martínez',
    telefono: '+56 9 1111 2222',
    email: 'ana.martinez@email.com',
    rut: '20.111.222-1',
    ultimaReserva: '2026-10-06',
    estado: 'Activo',
    codigoRestaurante: 'LOC-01',
  },
  {
    id: 5,
    nombre: 'Luis Ramírez',
    telefono: '+56 9 9999 8888',
    email: 'luis.ramirez@email.com',
    rut: '11.222.333-4',
    ultimaReserva: '2026-08-20',
    estado: 'Activo',
    codigoRestaurante: 'LOC-02',
  },
];

const USUARIOS_SEED = [
  {
    nombre: 'Administración General Demo',
    email: 'admin.general@saboresurbanos.dev',
    password: DEVELOPMENT_PASSWORD,
    rol: ROLES.ADMIN_GENERAL,
    codigoRestaurante: null,
    activo: true,
  },
  {
    nombre: 'Administración Local Demo',
    email: 'admin.local@saboresurbanos.dev',
    password: DEVELOPMENT_PASSWORD,
    rol: ROLES.ADMIN_LOCAL,
    codigoRestaurante: 'LOC-01',
    activo: true,
  },
  {
    nombre: 'Garzón Demo',
    email: 'garzon@saboresurbanos.dev',
    password: DEVELOPMENT_PASSWORD,
    rol: ROLES.GARZON,
    codigoRestaurante: 'LOC-01',
    activo: true,
  },
  {
    nombre: 'Cocina Demo',
    email: 'cocina@saboresurbanos.dev',
    password: DEVELOPMENT_PASSWORD,
    rol: ROLES.COCINA,
    codigoRestaurante: 'LOC-02',
    activo: true,
  },
];

async function asegurarRestaurantes() {
  const mapaPorCodigo = new Map();

  for (const data of RESTAURANTES_BASE) {
    let restaurante = await Restaurante.findOne({ codigo: data.codigo });
    if (!restaurante) {
      restaurante = await Restaurante.create(data);
    }
    mapaPorCodigo.set(data.codigo, restaurante._id);
  }

  return mapaPorCodigo;
}

async function seedClientesYUsuarios() {
  await connectDB();

  try {
    const restaurantesPorCodigo = await asegurarRestaurantes();

    await Usuario.deleteMany({});
    await Cliente.deleteMany({});

    for (const { codigoRestaurante, ...cliente } of CLIENTES_SEED) {
      await new Cliente({
        ...cliente,
        restaurante: restaurantesPorCodigo.get(codigoRestaurante),
      }).save();
    }

    for (const { codigoRestaurante, ...usuario } of USUARIOS_SEED) {
      await new Usuario({
        ...usuario,
        restaurante: codigoRestaurante
          ? restaurantesPorCodigo.get(codigoRestaurante)
          : null,
      }).save();
    }

    console.log(
      `Seed completado: ${CLIENTES_SEED.length} clientes y ${USUARIOS_SEED.length} usuarios cargados.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seedClientesYUsuarios().catch((error) => {
  console.error('Error al ejecutar el seed de clientes y usuarios:', error);
  process.exitCode = 1;
});
