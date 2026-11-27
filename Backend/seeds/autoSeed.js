import { Cliente } from '../models/Cliente.js';
import { Mesa } from '../models/Mesa.js';
import { Pedido, ESTADOS_PEDIDO_ABIERTO } from '../models/Pedido.js';
import { Producto } from '../models/Producto.js';
import { Reporte } from '../models/Reporte.js';
import { Reserva } from '../models/Reserva.js';
import { Restaurante } from '../models/Restaurante.js';
import { Usuario } from '../models/Usuario.js';

import { RESTAURANTES_SEED, construirReportes } from './seed.js';
import { CLIENTES_SEED, USUARIOS_SEED } from './seedClientes.js';
import { mesasIniciales } from './seedMesas.js';
import { pedidosIniciales } from './seedPedidos.js';
import { productosIniciales } from './seedProductos.js';
import { reservasIniciales } from './seedReservas.js';

// Marca como ocupadas las mesas con pedido abierto. Con `liberarSinPedido`,
// además deja disponibles las ocupadas sin pedido (solo al cargar datos de ejemplo).
export const sincronizarMesasConPedidos = async ({ liberarSinPedido = false } = {}) => {
  const mesasConPedido = await Pedido.distinct('mesaId', { estado: { $in: ESTADOS_PEDIDO_ABIERTO } });

  await Mesa.updateMany(
    { id: { $in: mesasConPedido }, estado: { $ne: 'ocupada' } },
    { estado: 'ocupada' }
  );
  if (liberarSinPedido) {
    await Mesa.updateMany(
      { id: { $nin: mesasConPedido }, estado: 'ocupada' },
      { estado: 'disponible' }
    );
  }
};

// Carga los datos de ejemplo en cada colección que esté vacía.
// No toca las colecciones que ya tienen datos.
export const sembrarSiVacia = async () => {
  const cargadas = [];

  if (!(await Restaurante.exists({}))) {
    await Restaurante.insertMany(RESTAURANTES_SEED);
    cargadas.push('restaurantes');
  }

  const restaurantes = await Restaurante.find({
    codigo: { $in: ['LOC-01', 'LOC-02', 'LOC-03'] }
  });
  const porCodigo = new Map(restaurantes.map((r) => [r.codigo, r]));

  if (!(await Reporte.exists({})) && porCodigo.size === 3) {
    await Reporte.insertMany(
      construirReportes({
        santiagoCentro: porCodigo.get('LOC-01'),
        providencia: porCodigo.get('LOC-02'),
        lasCondes: porCodigo.get('LOC-03')
      })
    );
    cargadas.push('reportes');
  }

  if (!(await Mesa.exists({}))) {
    await Mesa.insertMany(mesasIniciales);
    cargadas.push('mesas');
  }

  if (!(await Producto.exists({}))) {
    await Producto.insertMany(productosIniciales);
    cargadas.push('productos');
  }

  if (!(await Pedido.exists({}))) {
    await Pedido.insertMany(pedidosIniciales);
    cargadas.push('pedidos');
  }

  if (!(await Reserva.exists({}))) {
    await Reserva.syncIndexes();
    await Reserva.insertMany(reservasIniciales);
    cargadas.push('reservas');
  }

  if (!(await Cliente.exists({}))) {
    for (const { codigoRestaurante, ...cliente } of CLIENTES_SEED) {
      await new Cliente({
        ...cliente,
        restaurante: porCodigo.get(codigoRestaurante)?._id
      }).save();
    }
    cargadas.push('clientes');
  }

  if (!(await Usuario.exists({}))) {
    for (const { codigoRestaurante, ...usuario } of USUARIOS_SEED) {
      await new Usuario({
        ...usuario,
        restaurante: codigoRestaurante ? porCodigo.get(codigoRestaurante)?._id : null
      }).save();
    }
    cargadas.push('usuarios');
  }

  // Siempre: una mesa con pedido abierto debe figurar ocupada (repara cortes a mitad de operación)
  await sincronizarMesasConPedidos({
    liberarSinPedido: cargadas.includes('mesas') || cargadas.includes('pedidos')
  });

  if (cargadas.length > 0) {
    console.log(`Datos iniciales cargados: ${cargadas.join(', ')}`);
  }
};
