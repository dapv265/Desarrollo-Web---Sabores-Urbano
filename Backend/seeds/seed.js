import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Restaurante } from '../models/Restaurante.js';
import { Reporte } from '../models/Reporte.js';

dotenv.config();

const poblarBaseDeDatos = async () => {
  try {
    await connectDB();

    console.log('Limpiando colecciones anteriores...');
    await Restaurante.deleteMany();
    await Reporte.deleteMany();

    // 1. Insertamos Restaurantes
    console.log('Insertando Restaurantes...');
    const restaurantesCreados = await Restaurante.insertMany([
      {
        codigo: 'LOC-01',
        nombre: 'Sucursal Santiago Centro',
        direccion: 'Moneda 850, Santiago',
        telefono: '+56 2 2233 4455',
        horario: '12:00 - 23:00',
        capacidadMesas: 15,
        estado: 'Operativo'
      },
      {
        codigo: 'LOC-02',
        nombre: 'Sucursal Providencia',
        direccion: 'Av. Pedro de Valdivia 520, Providencia',
        telefono: '+56 2 2244 5566',
        horario: '12:30 - 00:00',
        capacidadMesas: 20,
        estado: 'Operativo'
      },
      {
        codigo: 'LOC-03',
        nombre: 'Sucursal Las Condes',
        direccion: 'Av. Apoquindo 4800, Las Condes',
        telefono: '+56 2 2255 6677',
        horario: '12:00 - 23:30',
        capacidadMesas: 18,
        estado: 'En Mantención'
      }
    ]);

    // Buscamos los IDs generados por MongoDB para asociar los reportes
    const providencia = restaurantesCreados.find(r => r.codigo === 'LOC-02');
    const santiagoCentro = restaurantesCreados.find(r => r.codigo === 'LOC-01');
    const lasCondes = restaurantesCreados.find(r => r.codigo === 'LOC-03');

    // 2. Insertamos Reportes con datos numéricos limpios y vinculados al restaurante
    console.log('Insertando Reportes...');
    await Reporte.insertMany([
      {
        periodo: '2026-10',
        restaurante: providencia._id,
        pedidosTotales: 520,
        ventasTotales: 8200000,
        tasaOcupacion: 85,
        platosMasVendidos: [
          { nombre: 'Lomo a lo Pobre Urbano', categoria: 'Fondos', cantidad: 180, totalRecaudado: 2340000 },
          { nombre: 'Pisco Sour Catedral', categoria: 'Bebidas', cantidad: 150, totalRecaudado: 900000 }
        ]
      },
      {
        periodo: '2026-10',
        restaurante: santiagoCentro._id,
        pedidosTotales: 410,
        ventasTotales: 5950000,
        tasaOcupacion: 74,
        platosMasVendidos: [
          { nombre: 'Pastel de Choclo', categoria: 'Fondos', cantidad: 120, totalRecaudado: 1320000 }
        ]
      },
      {
        periodo: '2026-10',
        restaurante: lasCondes._id,
        pedidosTotales: 310,
        ventasTotales: 4300000,
        tasaOcupacion: 68,
        platosMasVendidos: [
          { nombre: 'Ceviche Mixto', categoria: 'Entradas', cantidad: 90, totalRecaudado: 1080000 }
        ]
      }
    ]);

    console.log('✅ Base de datos poblada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
};

poblarBaseDeDatos();