import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { Pedido } from '../models/Pedido.js';

dotenv.config();

const pedidosIniciales = [
  {
    mesaId: 'T-01',
    mesaNombre: 'T-01',
    cliente: 'Juan Pérez',
    estado: 'Pendiente',
    hora: '19:30',
    items: [
      {
        id: 1,
        productoId: 1,
        nombre: 'Hamburguesa Especial',
        precio: 18000,
        cantidad: 2,
        observaciones: 'Sin cebolla',
        estado: 'Pendiente'
      },
      {
        id: 2,
        productoId: 3,
        nombre: 'Limonada Natural',
        precio: 6000,
        cantidad: 2,
        observaciones: 'Poca azúcar',
        estado: 'Pendiente'
      }
    ],
    total: 48000
  },
  {
    mesaId: 'M-05',
    mesaNombre: 'M-05',
    cliente: 'María González',
    estado: 'Preparando',
    hora: '19:15',
    items: [
      {
        id: 3,
        productoId: 4,
        nombre: 'Ceviche Urbano',
        precio: 14500,
        cantidad: 1,
        observaciones: 'Sin ají',
        estado: 'Preparando'
      },
      {
        id: 4,
        productoId: 7,
        nombre: 'Lomo Saltado',
        precio: 16500,
        cantidad: 1,
        observaciones: '',
        estado: 'Preparando'
      }
    ],
    total: 31000
  }
];

const poblarPedidos = async () => {
  try {
    await connectDB();

    console.log('Limpiando pedidos anteriores...');
    await Pedido.deleteMany();

    console.log('Insertando pedidos de ejemplo...');
    await Pedido.insertMany(pedidosIniciales);

    console.log('Pedidos cargados correctamente.');
    console.log(`Total de pedidos: ${pedidosIniciales.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    process.exit(1);
  }
};

poblarPedidos();
