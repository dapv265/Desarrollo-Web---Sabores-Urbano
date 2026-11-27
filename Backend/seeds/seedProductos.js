import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { Producto } from '../models/Producto.js';
import { esEjecucionDirecta } from './esEjecucionDirecta.js';

dotenv.config();

// Mismas categorías y productos que tenía frontend/src/data/menuData.js
export const categoriasIniciales = [
  { id: 1, nombre: 'Entradas' },
  { id: 2, nombre: 'Platos principales' },
  { id: 3, nombre: 'Bebidas' },
  { id: 4, nombre: 'Postres' },
  { id: 5, nombre: 'Ensaladas' }
];

export const productosIniciales = [
  { id: 1, nombre: 'Hamburguesa Especial', descripcion: 'Hamburguesa artesanal con carne, queso y vegetales.', precio: 18000, categoriaId: 2, imagen: '/images/hamburguesa-especial.jpg', tiempoPreparacion: 20, disponible: true, destacado: true },
  { id: 2, nombre: 'Papas de la Casa', descripcion: 'Papas crocantes acompanadas de salsa especial.', precio: 9000, categoriaId: 1, imagen: '/images/papas-casa.jpg', tiempoPreparacion: 12, disponible: true, destacado: false },
  { id: 3, nombre: 'Limonada Natural', descripcion: 'Limonada preparada con limon fresco.', precio: 6000, categoriaId: 3, imagen: '/images/limonada-natural.jpg', tiempoPreparacion: 5, disponible: true, destacado: false },
  { id: 4, nombre: 'Ceviche Urbano', descripcion: 'Pescado fresco, limon, cebolla morada, cilantro y maiz tostado.', precio: 14500, categoriaId: 1, imagen: '/images/ceviche-urbano.jpg', tiempoPreparacion: 15, disponible: true, destacado: true },
  { id: 5, nombre: 'Empanadas de Queso', descripcion: 'Empanadas doradas con queso fundido y pebre de la casa.', precio: 7800, categoriaId: 1, imagen: '/images/empanadas-queso.jpg', tiempoPreparacion: 10, disponible: true, destacado: false },
  { id: 6, nombre: 'Tabla Sabores Urbanos', descripcion: 'Mix para compartir con carnes, papas rusticas, salsas y verduras grilladas.', precio: 24900, categoriaId: 1, imagen: '/images/tabla-sabores.jpg', tiempoPreparacion: 25, disponible: true, destacado: true },
  { id: 7, nombre: 'Lomo Saltado', descripcion: 'Carne salteada con cebolla, tomate, papas doradas y arroz.', precio: 16500, categoriaId: 2, imagen: '/images/lomo-saltado.jpg', tiempoPreparacion: 22, disponible: true, destacado: false },
  { id: 8, nombre: 'Pastel de Choclo', descripcion: 'Pastel horneado con pino, pollo, aceituna, huevo y pastelera dulce.', precio: 13900, categoriaId: 2, imagen: '/images/pastel-choclo.jpg', tiempoPreparacion: 28, disponible: true, destacado: false },
  { id: 9, nombre: 'Risotto de Champinones', descripcion: 'Arroz cremoso con champinones, queso parmesano y aceite de hierbas.', precio: 15200, categoriaId: 2, imagen: '/images/risotto-champinones.jpg', tiempoPreparacion: 24, disponible: true, destacado: false },
  { id: 10, nombre: 'Ensalada Mediterranea', descripcion: 'Hojas verdes, tomate cherry, aceitunas, queso fresco y vinagreta citrica.', precio: 9800, categoriaId: 5, imagen: '/images/ensalada-mediterranea.jpg', tiempoPreparacion: 9, disponible: true, destacado: false },
  { id: 11, nombre: 'Ensalada Cesar con Pollo', descripcion: 'Lechuga romana, pollo grillado, crutones, parmesano y aderezo cesar.', precio: 11900, categoriaId: 5, imagen: '/images/ensalada-cesar-pollo.jpg', tiempoPreparacion: 12, disponible: true, destacado: false },
  { id: 12, nombre: 'Pisco Sour', descripcion: 'Coctel clasico con pisco, limon, goma y amargo de angostura.', precio: 6900, categoriaId: 3, imagen: '/images/pisco-sour.jpg', tiempoPreparacion: 6, disponible: true, destacado: false },
  { id: 13, nombre: 'Jugo Natural de Mango', descripcion: 'Jugo preparado al momento con mango, agua filtrada y hielo.', precio: 6200, categoriaId: 3, imagen: '/images/jugo-mango.jpg', tiempoPreparacion: 5, disponible: true, destacado: false },
  { id: 14, nombre: 'Tiramisu Tradicional', descripcion: 'Postre frio con cafe, crema mascarpone y cacao amargo.', precio: 7200, categoriaId: 4, imagen: '/images/tiramisu.jpg', tiempoPreparacion: 7, disponible: true, destacado: true },
  { id: 15, nombre: 'Cheesecake de Frutos Rojos', descripcion: 'Base crocante, crema de queso y salsa casera de frutos rojos.', precio: 7600, categoriaId: 4, imagen: '/images/cheesecake-frutos-rojos.jpg', tiempoPreparacion: 8, disponible: true, destacado: false },
  { id: 16, nombre: 'Brownie con Helado', descripcion: 'Brownie tibio de chocolate con helado de vainilla y salsa de cacao.', precio: 7900, categoriaId: 4, imagen: '/images/brownie-helado.jpg', tiempoPreparacion: 8, disponible: false, destacado: false }
];

const poblarProductos = async () => {
  try {
    await connectDB();

    console.log('Limpiando productos anteriores...');
    await Producto.deleteMany({});

    console.log('Insertando productos del menú...');
    await Producto.insertMany(productosIniciales);

    console.log(`Productos cargados correctamente: ${productosIniciales.length}`);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

if (esEjecucionDirecta(import.meta.url)) {
  poblarProductos();
}
