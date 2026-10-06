import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Check, UtensilsCrossed } from 'lucide-react';

const getStoredPedidos = () => {
  const stored = localStorage.getItem('pedidos_sabores_urbano_v2');
  if (stored) return JSON.parse(stored);
  return [];
};

const savePedidos = (pedidos) => {
  localStorage.setItem('pedidos_sabores_urbano_v2', JSON.stringify(pedidos));
};

import PedidoCard from '../../components/PedidoCard';

export default function CocinaPage() {
  const [pedidos, setPedidos] = useState([]);

  // Load periodically to simulate real-time kitchen display (RF11)
  useEffect(() => {
    const loadPedidos = () => {
      setPedidos(getStoredPedidos());
    };
    loadPedidos();
    const interval = setInterval(loadPedidos, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (pedidoId, nuevoEstado) => {
    const updatedPedidos = pedidos.map(p => {
      if (p.id === pedidoId) {
        return { 
          ...p, 
          estado: nuevoEstado,
          items: p.items.map(item => {
            if (nuevoEstado === 'Listo') return { ...item, estado: 'Listo' };
            if (nuevoEstado === 'Preparando' && item.estado === 'Pendiente') return { ...item, estado: 'Preparando' };
            return item;
          })
        };
      }
      return p;
    });
    setPedidos(updatedPedidos);
    savePedidos(updatedPedidos);
  };

  // Cocina solo ve pedidos que no estén "Pagado" (y filtramos los que no tienen items)
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
              <PedidoCard key={pedido.id} pedido={pedido} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )}

        {pedidosListos.length > 0 && (
          <>
            <h2 className="text-2xl text-gray-600 mb-6 border-b-2 border-gray-200 pb-2 inline-block font-bold">Recientemente Listos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-70">
              {pedidosListos.map(pedido => (
                <div key={pedido.id} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-200">
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
