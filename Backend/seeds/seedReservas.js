
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Mesa } from '../models/Mesa.js';
import { Reserva } from '../models/Reserva.js';

dotenv.config();

// Clientes de frontend/src/data/clientesData.js
const juan = { clienteRut: '12.345.678-9', cliente: 'Juan Pérez', telefono: '+56 9 1234 5678' };
const maria = { clienteRut: '19.876.543-2', cliente: 'María González', telefono: '+56 9 8765 4321' };
const carlos = { clienteRut: '15.444.333-K', cliente: 'Carlos Soto', telefono: '+56 9 5555 4444' };
const ana = { clienteRut: '20.111.222-1', cliente: 'Ana Martínez', telefono: '+56 9 1111 2222' };
const luis = { clienteRut: '11.222.333-4', cliente: 'Luis Ramírez', telefono: '+56 9 9999 8888' };

// Mesas de seedMesas.js (sin M-10, que está fuera de servicio)
const reservasIniciales = [
  // 2026-10-16 (mismo día que el frontend)
  { ...juan, personas: 2, fecha: '2026-10-16', inicio: '12:30', fin: '13:30', mesa: 'T-02', observaciones: 'Prefiere mesa junto a ventana.', estado: 'confirmada' },
  { ...ana, personas: 4, fecha: '2026-10-16', inicio: '13:00', fin: '14:30', mesa: 'M-05', observaciones: 'Celebración de cumpleaños.', estado: 'pendiente' },
  { ...luis, personas: 6, fecha: '2026-10-16', inicio: '20:00', fin: '21:30', mesa: 'T-03', observaciones: 'Solicita silla para bebé.', estado: 'en-espera' },
  { ...carlos, personas: 2, fecha: '2026-10-16', inicio: '21:00', fin: '22:00', mesa: 'M-07', observaciones: '', estado: 'cancelada' },

  // 2026-11-12 (incluye la reserva de M-09 usada para probar el 409)
  { ...maria, personas: 8, fecha: '2026-11-12', inicio: '19:30', fin: '21:30', mesa: 'M-09', observaciones: 'Cena de aniversario.', estado: 'confirmada' },
  { ...juan, personas: 4, fecha: '2026-11-12', inicio: '13:00', fin: '14:00', mesa: 'T-01', observaciones: '', estado: 'confirmada' },
  { ...carlos, personas: 3, fecha: '2026-11-12', inicio: '20:00', fin: '21:00', mesa: 'B-13', observaciones: 'Prefiere la barra.', estado: 'pendiente' },
  { ...ana, personas: 2, fecha: '2026-11-12', inicio: '12:00', fin: '13:00', mesa: 'M-07', observaciones: '', estado: 'en-espera' },

  // 2026-11-13
  { ...luis, personas: 4, fecha: '2026-11-13', inicio: '13:30', fin: '15:00', mesa: 'M-06', observaciones: 'Almuerzo de trabajo.', estado: 'confirmada' },
  { ...maria, personas: 6, fecha: '2026-11-13', inicio: '20:30', fin: '22:00', mesa: 'M-08', observaciones: '', estado: 'confirmada' },
  { ...juan, personas: 2, fecha: '2026-11-13', inicio: '19:00', fin: '20:00', mesa: 'T-02', observaciones: '', estado: 'cancelada' },
  { ...ana, personas: 4, fecha: '2026-11-13', inicio: '21:00', fin: '22:30', mesa: 'M-11', observaciones: 'Un comensal vegetariano.', estado: 'pendiente' },

  // 2026-11-14
  { ...carlos, personas: 4, fecha: '2026-11-14', inicio: '12:30', fin: '14:00', mesa: 'T-04', observaciones: '', estado: 'confirmada' },
  { ...luis, personas: 8, fecha: '2026-11-14', inicio: '20:00', fin: '22:00', mesa: 'M-09', observaciones: 'Cena familiar.', estado: 'pendiente' },
  { ...maria, personas: 3, fecha: '2026-11-14', inicio: '14:00', fin: '15:00', mesa: 'M-12', observaciones: '', estado: 'en-espera' },
  { ...juan, personas: 6, fecha: '2026-11-14', inicio: '19:30', fin: '21:00', mesa: 'T-03', observaciones: 'Mesa en la terraza.', estado: 'confirmada' },

  // 2026-11-15
  { ...ana, personas: 4, fecha: '2026-11-15', inicio: '13:00', fin: '14:30', mesa: 'M-05', observaciones: '', estado: 'confirmada' },
  { ...luis, personas: 2, fecha: '2026-11-15', inicio: '20:00', fin: '21:00', mesa: 'M-07', observaciones: '', estado: 'cancelada' }
];

const poblarReservas = async () => {
  try {
    await connectDB();

    // Las reservas usan las mesas reales: deben cargarse antes con seedMesas.js
    const totalMesas = await Mesa.countDocuments();

    if (totalMesas === 0) {
      console.error('No hay mesas. Ejecuta primero: node seeds/seedMesas.js');
      process.exitCode = 1;
      return;
    }

    console.log('Limpiando la colección reservas...');
    await Reserva.deleteMany({});

    // Crea los índices definidos en el modelo (incluido el único parcial)
    await Reserva.syncIndexes();

    console.log('Insertando reservas...');
    await Reserva.insertMany(reservasIniciales);

    console.log('Reservas cargadas correctamente.');
    console.log(`Total de reservas: ${reservasIniciales.length}`);

  } catch (error) {
    console.error('Error al cargar reservas:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

poblarReservas();
