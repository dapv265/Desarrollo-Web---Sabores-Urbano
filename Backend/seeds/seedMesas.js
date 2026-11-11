
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Mesa } from '../models/Mesa.js';

dotenv.config();

const mesasIniciales = [
  { id: 'T-01', numero: 'T-01', zona: 'Terraza', capacidad: 4, estado: 'disponible' },
  { id: 'T-02', numero: 'T-02', zona: 'Terraza', capacidad: 2, estado: 'ocupada' },
  { id: 'T-03', numero: 'T-03', zona: 'Terraza', capacidad: 6, estado: 'reservada' },
  { id: 'T-04', numero: 'T-04', zona: 'Terraza', capacidad: 4, estado: 'disponible' },

  { id: 'M-05', numero: 'M-05', zona: 'Salón principal', capacidad: 4, estado: 'ocupada' },
  { id: 'M-06', numero: 'M-06', zona: 'Salón principal', capacidad: 4, estado: 'disponible' },
  { id: 'M-07', numero: 'M-07', zona: 'Salón principal', capacidad: 2, estado: 'limpieza' },
  { id: 'M-08', numero: 'M-08', zona: 'Salón principal', capacidad: 6, estado: 'ocupada' },
  { id: 'M-09', numero: 'M-09', zona: 'Salón principal', capacidad: 8, estado: 'reservada' },
  { id: 'M-10', numero: 'M-10', zona: 'Salón principal', capacidad: 4, estado: 'fuera' },
  { id: 'M-11', numero: 'M-11', zona: 'Salón principal', capacidad: 4, estado: 'disponible' },
  { id: 'M-12', numero: 'M-12', zona: 'Salón principal', capacidad: 4, estado: 'ocupada' },

  { id: 'B-13', numero: 'B-13', zona: 'Barra', capacidad: 3, estado: 'ocupada' }
];

const poblarMesas = async () => {
  try {
    await connectDB();

    console.log('Insertando mesas...');

    for (const mesa of mesasIniciales) {
      await Mesa.updateOne(
        { id: mesa.id },
        { $set: mesa },
        { upsert: true, runValidators: true }
      );
    }

    console.log('Mesas cargadas correctamente.');
    console.log(`Total de mesas: ${mesasIniciales.length}`);

  } catch (error) {
    console.error('Error al cargar mesas:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

poblarMesas();
