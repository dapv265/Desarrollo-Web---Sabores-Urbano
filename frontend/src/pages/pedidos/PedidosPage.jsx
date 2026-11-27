import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, ShoppingBag, Send } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { obtenerClientes } from '../../services/clientesService';
import { obtenerMesas } from '../../services/mesasService';
import { obtenerProductos } from '../../services/productosService';
import {
  obtenerPedidos,
  crearPedido,
  agregarProductoPedido,
  quitarProductoPedido,
  enviarComandaACocina,
  cambiarEstadoPedido,
  obtenerIdPedido,
  ESTADOS_PEDIDO_ABIERTO,
} from '../../services/pedidosService';

// Estados de mesa en los que no se puede abrir un pedido
const ESTADOS_MESA_BLOQUEADOS = ['fuera', 'limpieza'];

// Productos que el garzón aún puede quitar: sin enviar, o enviados que cocina no empezó
const ESTADOS_ITEM_QUITABLES = ['Borrador', 'Pendiente'];

// Cómo se muestra al garzón el estado de cada producto
const ETIQUETA_ITEM = {
  Borrador: 'Sin enviar',
  Pendiente: 'Enviado',
  Preparando: 'Preparando',
  Listo: 'Listo',
};

// Cada cuánto se refrescan pedidos y mesas (para ver cambios de Cocina y Mesas)
const INTERVALO_REFRESCO_MS = 5000;

export default function PedidosPage() {
  const { session } = useAuth();
  const token = session?.token;

  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mesaId, setMesaId] = useState('');
  const [clienteId, setClienteId] = useState('');

  const pedidoActual = pedidos.find(
    p => String(p.mesaId) === String(mesaId) && ESTADOS_PEDIDO_ABIERTO.includes(p.estado)
  );

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Pedidos abiertos y mesas cambian desde otras pantallas: se recargan juntos
  const cargarPedidosYMesas = useCallback(async () => {
    const [pedidosApi, mesasApi] = await Promise.all([
      obtenerPedidos(token, ESTADOS_PEDIDO_ABIERTO),
      obtenerMesas(),
    ]);
    setPedidos(pedidosApi);
    setMesas(mesasApi);
  }, [token]);

  useEffect(() => {
    let activo = true;

    const refrescar = () =>
      cargarPedidosYMesas().catch(err => {
        if (activo) setError(err.message);
      });

    refrescar();
    obtenerProductos()
      .then(data => {
        if (activo) setProductos(data);
      })
      .catch(err => {
        if (activo) setError(err.message);
      });

    const intervalo = setInterval(refrescar, INTERVALO_REFRESCO_MS);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [cargarPedidosYMesas]);

  useEffect(() => {
    let activo = true;

    obtenerClientes(token)
      .then(data => {
        if (activo) setClientes(data);
      })
      .catch(() => {
        if (activo) setClientes([]);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  const productosDisponibles = productos.filter(p => p.disponible);
  const productosSinEnviar = pedidoActual
    ? pedidoActual.items.filter(item => item.estado === 'Borrador').length
    : 0;
  const mesaSeleccionada = mesas.find(m => String(m.id) === String(mesaId));

  const reemplazarPedido = (pedidoActualizado) => {
    const id = obtenerIdPedido(pedidoActualizado);
    setPedidos(prev => prev.map(p => (obtenerIdPedido(p) === id ? pedidoActualizado : p)));
  };

  // Ejecuta una operación mostrando el error del backend si falla
  const ejecutar = async (operacion, mensajeExito = '') => {
    setEnviando(true);
    try {
      await operacion();
      setError('');
      setMensaje(mensajeExito);
      return true;
    } catch (err) {
      setMensaje('');
      setError(err.message);
      // Puede que otro usuario haya cambiado el pedido: se recarga para mostrar lo real
      cargarPedidosYMesas().catch(() => {});
      return false;
    } finally {
      setEnviando(false);
    }
  };

  const handleAbrirPedido = async () => {
    if (!mesaId) {
      setError('Debes seleccionar una mesa');
      return;
    }

    if (pedidoActual) {
      setError('Esta mesa ya tiene un pedido principal abierto.');
      return;
    }

    if (mesaSeleccionada && ESTADOS_MESA_BLOQUEADOS.includes(mesaSeleccionada.estado)) {
      setError(`La mesa ${mesaSeleccionada.numero} no puede recibir pedidos (estado: ${mesaSeleccionada.estado}).`);
      return;
    }

    const ok = await ejecutar(
      () => crearPedido(token, { mesaId, clienteId }),
      `Pedido abierto para la mesa ${mesaSeleccionada?.numero ?? mesaId}.`
    );

    if (ok) {
      setClienteId('');
      await cargarPedidosYMesas().catch(() => {});
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    if (!pedidoActual) return;

    const cantidadNumero = Number(cantidad);
    if (!productoId) {
      setError('Selecciona un producto.');
      return;
    }
    if (!Number.isInteger(cantidadNumero) || cantidadNumero < 1 || cantidadNumero > 50) {
      setError('La cantidad debe ser un número entero entre 1 y 50.');
      return;
    }

    const ok = await ejecutar(async () => {
      reemplazarPedido(
        await agregarProductoPedido(token, obtenerIdPedido(pedidoActual), {
          productoId: Number(productoId),
          cantidad: cantidadNumero,
          observaciones,
        })
      );
    }, 'Producto agregado a la comanda. Aún no se envía a cocina.');

    if (ok) {
      setProductoId('');
      setCantidad(1);
      setObservaciones('');
    }
  };

  const handleEliminarItem = (pedidoId, itemId) =>
    ejecutar(async () => {
      reemplazarPedido(await quitarProductoPedido(token, pedidoId, itemId));
    }, 'Producto quitado del pedido.');

  const handleEnviarACocina = (pedidoId) =>
    ejecutar(async () => {
      reemplazarPedido(await enviarComandaACocina(token, pedidoId));
    }, 'Comanda enviada a cocina.');

  const handleCerrarPedido = async (pedidoId) => {
    if (!window.confirm('¿Cobrar este pedido? La mesa quedará pendiente de limpieza.')) return;

    const ok = await ejecutar(
      () => cambiarEstadoPedido(token, pedidoId, 'Pagado'),
      'Pedido cobrado. La mesa quedó pendiente de limpieza.'
    );
    if (ok) await cargarPedidosYMesas().catch(() => {});
  };

  const handleCancelarPedido = async (pedidoId) => {
    if (!window.confirm('¿Cancelar este pedido? Quedará registrado como cancelado y la mesa volverá a estar disponible.')) return;

    const ok = await ejecutar(
      () => cambiarEstadoPedido(token, pedidoId, 'Cancelado'),
      'Pedido cancelado.'
    );
    if (ok) await cargarPedidosYMesas().catch(() => {});
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-brand-primary text-3xl md:text-4xl mb-2 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8" />
          Pedidos Garzón
        </h1>
        <p className="text-gray-600 mb-8">Abre pedidos por mesa y gestiona los productos solicitados.</p>

        {mensaje && !error && (
          <div className="bg-green-50 border-l-4 border-status-disponible p-4 mb-6 rounded flex items-center gap-3" role="status">
            <CheckCircle className="text-status-disponible w-5 h-5" />
            <p className="text-status-disponible font-medium">{mensaje}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-status-ocupado p-4 mb-6 rounded flex items-center gap-3">
            <AlertCircle className="text-status-ocupado w-5 h-5" />
            <p className="text-status-ocupado font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Izquierdo: Selección de Mesa y Apertura de Pedido */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100 h-fit">
            <h2 className="text-xl text-brand-primary mb-4 border-b pb-2">1. Seleccionar Mesa</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesa *</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[44px] focus:ring-brand-primary focus:border-brand-primary outline-none transition-shadow"
                  value={mesaId}
                  onChange={(e) => setMesaId(e.target.value)}
                >
                  <option value="">-- Seleccione Mesa --</option>
                  {mesas.map(m => (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={ESTADOS_MESA_BLOQUEADOS.includes(m.estado) && m.id !== mesaId}
                    >
                      {m.numero} ({m.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[44px] focus:ring-brand-primary focus:border-brand-primary outline-none transition-shadow"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  disabled={pedidoActual}
                >
                  <option value="">-- Consumidor Final --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>

              </div>

              {!pedidoActual ? (
                <button 
                  onClick={handleAbrirPedido}
                  disabled={enviando}
                  className="mt-4 w-full bg-brand-primary text-white py-2 px-4 min-h-[44px] rounded-md font-medium hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Abrir Pedido
                </button>
              ) : (
                <div className="mt-4 bg-green-50 text-status-disponible p-3 rounded-md flex flex-col gap-2 border border-green-200">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Mesa con pedido activo</span>
                  </div>
                  <p className="text-sm opacity-90">Puedes seguir agregando productos a esta mesa en el panel de la derecha.</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho: Agregar Productos y Resumen (Solo visible si hay pedido) */}
          <div className="lg:col-span-2">
            {pedidoActual ? (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-2xl text-brand-primary m-0">Comanda: {pedidoActual.mesaNombre}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    pedidoActual.estado === 'Pendiente' ? 'bg-red-100 text-status-ocupado' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pedidoActual.estado}
                  </span>
                </div>

                {/* Formulario Agregar Producto */}
                <form onSubmit={handleAgregarProducto} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-brand-primary mb-3">Agregar Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-12 mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">1. Selecciona el Producto</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {productosDisponibles.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => setProductoId(p.id)}
                            className={`cursor-pointer rounded-xl overflow-hidden transition-all border-2 bg-white ${
                              String(productoId) === String(p.id) 
                                ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-md transform scale-[1.02]' 
                                : 'border-transparent shadow-sm hover:shadow-md'
                            }`}
                          >
                            <img src={p.imagen} alt={p.nombre} className="w-full h-24 object-cover" />
                            <div className="p-2">
                              <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{p.nombre}</p>
                              <p className="text-brand-secondary font-medium text-sm">${p.precio.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Cant.</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full border border-gray-300 rounded-md p-2 min-h-[44px]"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Sin cebolla"
                        className="w-full border border-gray-300 rounded-md p-2 min-h-[44px]"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={enviando}
                    className="mt-4 w-full md:w-auto bg-brand-secondary text-white py-2 px-6 min-h-[44px] rounded-md font-medium hover:opacity-90 transition-colors"
                  >
                    Agregar a la Comanda
                  </button>
                </form>

                {/* Tabla de Productos del Pedido */}
                <div className="table-responsive">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-600">
                        <th className="py-3 px-2">Cant.</th>
                        <th className="py-3 px-2">Producto</th>
                        <th className="py-3 px-2">Observaciones</th>
                        <th className="py-3 px-2">Cocina</th>
                        <th className="py-3 px-2">P. Unit</th>
                        <th className="py-3 px-2">Total</th>
                        <th className="py-3 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoActual.items.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            Aún no hay productos en este pedido.
                          </td>
                        </tr>
                      ) : (
                        pedidoActual.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 font-medium">{item.cantidad}</td>
                            <td className="py-3 px-2">{item.nombre}</td>
                            <td className="py-3 px-2 text-sm text-gray-500 italic">{item.observaciones || '-'}</td>
                            <td className={`py-3 px-2 text-sm ${item.estado === 'Borrador' ? 'text-brand-secondary font-semibold' : ''}`}>
                              {ETIQUETA_ITEM[item.estado] ?? item.estado}
                            </td>
                            <td className="py-3 px-2">${item.precio.toLocaleString()}</td>
                            <td className="py-3 px-2 font-medium">${(item.precio * item.cantidad).toLocaleString()}</td>
                            <td className="py-3 px-2 text-center">
                              {ESTADOS_ITEM_QUITABLES.includes(item.estado) ? (
                              <button 
                                onClick={() => handleEliminarItem(obtenerIdPedido(pedidoActual), item.id)}
                                disabled={enviando}
                                className="text-red-500 hover:text-red-700 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-red-50 transition-colors mx-auto"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                              ) : (
                                <span className="text-xs text-gray-400" title="Cocina ya lo empezó; no se puede quitar">En cocina</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {pedidoActual.items.length > 0 && (
                      <tfoot>
                        <tr className="font-bold text-lg text-brand-primary">
                          <td colSpan="5" className="py-4 px-2 text-right">Total:</td>
                          <td colSpan="2" className="py-4 px-2">${pedidoActual.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Confirmar la comanda: hasta aquí cocina no ve los productos nuevos */}
                {productosSinEnviar > 0 && (
                  <div className="mt-6 p-4 rounded-lg border border-brand-secondary/40 bg-orange-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm text-gray-700 m-0">
                      {productosSinEnviar === 1
                        ? 'Hay 1 producto sin enviar.'
                        : `Hay ${productosSinEnviar} productos sin enviar.`}{' '}
                      Revisa la comanda con el cliente y envíala cuando esté completa.
                    </p>
                    <button
                      onClick={() => handleEnviarACocina(obtenerIdPedido(pedidoActual))}
                      disabled={enviando}
                      className="bg-brand-secondary text-white py-2.5 px-6 min-h-[44px] rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Send className="w-5 h-5" />
                      Enviar a cocina
                    </button>
                  </div>
                )}

                {/* Botones para cancelar o cobrar pedido */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center gap-4">
                  <button
                    onClick={() => handleCancelarPedido(obtenerIdPedido(pedidoActual))}
                    disabled={enviando}
                    className="text-red-600 hover:bg-red-50 py-2.5 px-4 min-h-[44px] rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Cancelar Pedido
                  </button>

                  {pedidoActual.items.length > 0 && (
                    <button 
                      onClick={() => handleCerrarPedido(obtenerIdPedido(pedidoActual))}
                      disabled={enviando || productosSinEnviar > 0}
                      title={productosSinEnviar > 0 ? 'Envía o quita los productos sin enviar antes de cobrar' : undefined}
                      className="bg-brand-primary text-white py-3 px-8 min-h-[44px] rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Cobrar pedido
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl text-gray-500 font-medium mb-2">Ningún pedido seleccionado</h3>
                <p className="text-gray-400">Selecciona una mesa en el panel izquierdo para abrir un nuevo pedido o ver el actual.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
