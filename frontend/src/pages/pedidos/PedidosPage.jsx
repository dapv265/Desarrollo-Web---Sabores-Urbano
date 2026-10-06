import React, { useState, useEffect } from 'react';
import { clientesData } from '../../data/clientesData';
import { mesasIniciales as mesasData } from '../../data/mesasData';
import { productosIniciales as productosData } from '../../data/menuData';
import { Plus, Trash2, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

const getStoredPedidos = () => {
  const stored = localStorage.getItem('pedidos_sabores_urbano_v2');
  if (stored) return JSON.parse(stored);
  return [];
};

const savePedidos = (pedidos) => {
  localStorage.setItem('pedidos_sabores_urbano_v2', JSON.stringify(pedidos));
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState(getStoredPedidos());
  const [mesaId, setMesaId] = useState('');
  const [clienteId, setClienteId] = useState('');
  
  // Current active order for the selected table
  const pedidoActual = pedidos.find(p => String(p.mesaId) === String(mesaId) && p.estado !== 'Pagado');

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    savePedidos(pedidos);
  }, [pedidos]);

  const handleAbrirPedido = () => {
    if (!mesaId) {
      setError('Debes seleccionar una mesa');
      return;
    }
    
    // Check if table already has an open order (RF9)
    if (pedidoActual) {
      setError('Esta mesa ya tiene un pedido principal abierto.');
      return;
    }

    const mesa = mesasData.find(m => String(m.id) === String(mesaId));
    const cliente = clientesData.find(c => String(c.id) === String(clienteId));

    const nuevoPedido = {
      id: Date.now(),
      mesaId: mesa.id,
      mesaNombre: mesa.numero,
      cliente: cliente ? cliente.nombre : 'Sin especificar',
      estado: 'Pendiente', // Pendiente, Preparando, Listo
      hora: new Date().toLocaleTimeString(),
      items: [],
      total: 0
    };

    const currentPedidos = getStoredPedidos();
    const nuevosPedidos = [...currentPedidos, nuevoPedido];
    setPedidos(nuevosPedidos);
    savePedidos(nuevosPedidos);
    setError('');
  };

  const handleAgregarProducto = (e) => {
    e.preventDefault();
    if (!pedidoActual) return;
    if (!productoId || cantidad < 1) {
      setError('Selecciona un producto y cantidad válida.');
      return;
    }

    const producto = productosData.find(p => String(p.id) === String(productoId));
    
    // RF10: conservar precio vigente al momento
    const nuevoItem = {
      id: Date.now(), // unique ID for the item line
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio, // Conserva precio actual
      cantidad: parseInt(cantidad),
      observaciones: observaciones,
      estado: 'Pendiente'
    };

    // Leer SIEMPRE desde localStorage antes de modificar para evitar pisar los cambios de la cocina (stale state)
    const currentPedidos = getStoredPedidos();

    const updatedPedidos = currentPedidos.map(p => {
      if (p.id === pedidoActual.id) {
        return {
          ...p,
          estado: 'Pendiente', // Volver a pendiente para que la cocina vea el nuevo producto
          items: [...p.items, nuevoItem],
          total: p.total + (nuevoItem.precio * nuevoItem.cantidad)
        };
      }
      return p;
    });

    setPedidos(updatedPedidos);
    savePedidos(updatedPedidos);
    setProductoId('');
    setCantidad(1);
    setObservaciones('');
    setError('');
  };

  const handleEliminarItem = (pedidoId, itemId) => {
    const currentPedidos = getStoredPedidos();
    const updatedPedidos = currentPedidos.map(p => {
      if (p.id === pedidoId) {
        const itemToRemove = p.items.find(i => i.id === itemId);
        return {
          ...p,
          items: p.items.filter(i => i.id !== itemId),
          total: p.total - (itemToRemove.precio * itemToRemove.cantidad)
        };
      }
      return p;
    });
    setPedidos(updatedPedidos);
    savePedidos(updatedPedidos);
  };

  const handleCerrarPedido = (pedidoId) => {
    if (window.confirm('¿Estás seguro de cobrar este pedido y liberar la mesa?')) {
      const currentPedidos = getStoredPedidos();
      const updatedPedidos = currentPedidos.map(p => {
        if (p.id === pedidoId) {
          return { ...p, estado: 'Pagado' };
        }
        return p;
      });
      setPedidos(updatedPedidos);
      savePedidos(updatedPedidos);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-brand-primary text-3xl md:text-4xl mb-2 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8" />
          Pedidos Garzón
        </h1>
        <p className="text-gray-600 mb-8">Abre pedidos por mesa y gestiona los productos solicitados.</p>

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
                  {mesasData.map(m => (
                    <option key={m.id} value={m.id}>{m.numero} ({m.estado})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (Opcional)</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[44px] focus:ring-brand-primary focus:border-brand-primary outline-none transition-shadow"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  disabled={pedidoActual} // disable if order is open
                >
                  <option value="">-- Consumidor Final --</option>
                  {clientesData.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {!pedidoActual ? (
                <button 
                  onClick={handleAbrirPedido}
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
                        {productosData.map(p => (
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
                        <th className="py-3 px-2">P. Unit</th>
                        <th className="py-3 px-2">Total</th>
                        <th className="py-3 px-2 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoActual.items.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500">
                            Aún no hay productos en este pedido.
                          </td>
                        </tr>
                      ) : (
                        pedidoActual.items.map(item => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 font-medium">{item.cantidad}</td>
                            <td className="py-3 px-2">{item.nombre}</td>
                            <td className="py-3 px-2 text-sm text-gray-500 italic">{item.observaciones || '-'}</td>
                            <td className="py-3 px-2">${item.precio.toLocaleString()}</td>
                            <td className="py-3 px-2 font-medium">${(item.precio * item.cantidad).toLocaleString()}</td>
                            <td className="py-3 px-2 text-center">
                              <button 
                                onClick={() => handleEliminarItem(pedidoActual.id, item.id)}
                                className="text-red-500 hover:text-red-700 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-red-50 transition-colors mx-auto"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {pedidoActual.items.length > 0 && (
                      <tfoot>
                        <tr className="font-bold text-lg text-brand-primary">
                          <td colSpan="4" className="py-4 px-2 text-right">Total:</td>
                          <td colSpan="2" className="py-4 px-2">${pedidoActual.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Botón para cerrar pedido y liberar mesa */}
                {pedidoActual.items.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                      onClick={() => handleCerrarPedido(pedidoActual.id)}
                      className="bg-brand-primary text-white py-3 px-8 min-h-[44px] rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Cobrar y Liberar Mesa
                    </button>
                  </div>
                )}

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
