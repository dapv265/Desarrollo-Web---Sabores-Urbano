import React, { useState, useEffect } from 'react';
import { clientesData } from '../../data/clientesData';
import { mesasIniciales as mesasData } from '../../data/mesasData';
import { productosIniciales as productosData } from '../../data/menuData';
import { Plus, Trash2, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/pedidos';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [mesaId, setMesaId] = useState('');
  const [clienteId, setClienteId] = useState('');
  
  const pedidoActual = pedidos.find(p => String(p.mesaId) === String(mesaId) && p.estado !== 'Pagado');

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  const cargarPedidos = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleAbrirPedido = async () => {
    if (!mesaId) {
      setError('Debes seleccionar una mesa');
      return;
    }
    
    if (pedidoActual) {
      setError('Esta mesa ya tiene un pedido principal abierto.');
      return;
    }

    const mesa = mesasData.find(m => String(m.id) === String(mesaId));
    const cliente = clientesData.find(c => String(c.id) === String(clienteId));

    const nuevoPedido = {
      mesaId: mesa.id,
      mesaNombre: mesa.numero,
      cliente: cliente ? cliente.nombre : 'Sin especificar',
      estado: 'Pendiente',
      hora: new Date().toLocaleTimeString(),
      items: [],
      total: 0
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPedido)
      });
      const pedidoCreado = await res.json();
      setPedidos([...pedidos, pedidoCreado]);
      setError('');
    } catch (err) {
      setError('Error al guardar el pedido');
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    if (!pedidoActual) return;
    if (!productoId || cantidad < 1) {
      setError('Selecciona un producto y cantidad válida.');
      return;
    }

    const producto = productosData.find(p => String(p.id) === String(productoId));
    const pedidoId = pedidoActual._id || pedidoActual.id;
    
    const nuevoItem = {
      id: Date.now(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: parseInt(cantidad),
      observaciones: observaciones,
      estado: 'Pendiente'
    };

    const datosActualizados = {
      estado: 'Pendiente',
      items: [...pedidoActual.items, nuevoItem],
      total: pedidoActual.total + (nuevoItem.precio * nuevoItem.cantidad)
    };

    try {
      const res = await fetch(`${API_URL}/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      const pedidoActualizado = await res.json();
      setPedidos(pedidos.map(p => ((p._id || p.id) === pedidoId ? pedidoActualizado : p)));
      setProductoId('');
      setCantidad(1);
      setObservaciones('');
      setError('');
    } catch (err) {
      setError('Error al agregar producto');
    }
  };

  const handleEliminarItem = async (pedidoId, itemId) => {
    const itemToRemove = pedidoActual.items.find(i => i.id === itemId);
    const datosActualizados = {
      items: pedidoActual.items.filter(i => i.id !== itemId),
      total: pedidoActual.total - (itemToRemove.precio * itemToRemove.cantidad)
    };

    try {
      const res = await fetch(`${API_URL}/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      const pedidoActualizado = await res.json();
      setPedidos(pedidos.map(p => ((p._id || p.id) === pedidoId ? pedidoActualizado : p)));
    } catch (err) {
      setError('Error al eliminar producto');
    }
  };

  const handleCerrarPedido = async (pedidoId) => {
    if (window.confirm('¿Estás seguro de cobrar este pedido y liberar la mesa?')) {
      try {
        const res = await fetch(`${API_URL}/${pedidoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'Pagado' })
        });
        const pedidoActualizado = await res.json();
        setPedidos(pedidos.map(p => ((p._id || p.id) === pedidoId ? pedidoActualizado : p)));
      } catch (err) {
        setError('Error al cerrar el pedido');
      }
    }
  };

  const handleEliminarPedido = async (pedidoId) => {
    if (window.confirm('¿Deseas cancelar y eliminar este pedido?')) {
      try {
        await fetch(`${API_URL}/${pedidoId}`, { method: 'DELETE' });
        setPedidos(pedidos.filter(p => (p._id || p.id) !== pedidoId));
      } catch (err) {
        setError('Error al eliminar el pedido');
      }
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
                  disabled={pedidoActual}
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
                                onClick={() => handleEliminarItem(pedidoActual._id || pedidoActual.id, item.id)}
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

                {/* Botones para cancelar o cobrar pedido */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center gap-4">
                  <button
                    onClick={() => handleEliminarPedido(pedidoActual._id || pedidoActual.id)}
                    className="text-red-600 hover:bg-red-50 py-2.5 px-4 min-h-[44px] rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Cancelar Pedido
                  </button>

                  {pedidoActual.items.length > 0 && (
                    <button 
                      onClick={() => handleCerrarPedido(pedidoActual._id || pedidoActual.id)}
                      className="bg-brand-primary text-white py-3 px-8 min-h-[44px] rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Cobrar y Liberar Mesa
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
