import React, { useState, useEffect } from 'react';
import { ChefHat, Check, UtensilsCrossed } from 'lucide-react';
import PedidoCard from '../../components/PedidoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/pedidos';

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setPedidos(data);
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
      }
    };

    loadPedidos();
    const interval = setInterval(loadPedidos, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (pedidoId, nuevoEstado) => {
    const pedido = pedidos.find(p => (p._id || p.id) === pedidoId);
    if (!pedido) return;

    const itemsActualizados = pedido.items.map(item => {
      if (nuevoEstado === 'Listo') return { ...item, estado: 'Listo' };
      if (nuevoEstado === 'Preparando' && item.estado === 'Pendiente') return { ...item, estado: 'Preparando' };
      return item;
    });

    try {
      const res = await fetch(`${API_URL}/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, items: itemsActualizados })
      });
      const pedidoActualizado = await res.json();
      setPedidos(pedidos.map(p => ((p._id || p.id) === pedidoId ? pedidoActualizado : p)));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const pedidosCocina = pedidos.filter(p => p.items.length > 0 && p.estado !== 'Listo' && p.estado !== 'Pagado');
  const pedidosListos = pedidos.filter(p => p.items.length > 0 && p.estado === 'Listo');

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-brand-primary text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <ChefHat className="w-8 h-8" />
              Monitor Cocina
            </h1>
            <p className="text-gray-600 text-lg">Visualiza pedidos pendientes y actualiza su estado.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-status-ocupado"></div>
              <span className="text-sm font-semibold text-gray-700">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-brand-accent"></div>
              <span className="text-sm font-semibold text-gray-700">Preparando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-status-disponible"></div>
              <span className="text-sm font-semibold text-gray-700">Listo</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl text-brand-primary mb-6 border-b-2 border-brand-primary pb-2 inline-block font-bold">Pedidos Activos</h2>

        {pedidosCocina.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay pedidos activos</h3>
            <p className="text-gray-500">La cocina está al día con los pedidos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {pedidosCocina.map(pedido => (
              <PedidoCard key={pedido._id || pedido.id} pedido={pedido} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )}

        {pedidosListos.length > 0 && (
          <>
            <h2 className="text-2xl text-gray-600 mb-6 border-b-2 border-gray-200 pb-2 inline-block font-bold">Recientemente Listos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-70">
              {pedidosListos.map(pedido => (
                <div key={pedido._id || pedido.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-200">
                  <div>
                    <h4 className="font-bold text-gray-800">{pedido.mesaNombre}</h4>
                    <p className="text-sm text-gray-500">{pedido.items.length} productos</p>
                  </div>
                  <div>
                    <Check className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
