import { Router } from 'express';

import {
  obtenerCategorias,
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  cambiarPrecioProducto,
  eliminarProducto
} from '../controllers/productoController.js';

const router = Router();

router.get('/categorias', obtenerCategorias);
router.get('/', obtenerProductos);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/precio', cambiarPrecioProducto);
router.delete('/:id', eliminarProducto);

export default router;
