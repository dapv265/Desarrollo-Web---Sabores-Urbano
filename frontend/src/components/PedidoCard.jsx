import React from 'react';
import { Clock, Check } from 'lucide-react';

export default function PedidoCard({ pedido, onUpdateStatus }) {
  const isPendiente = pedido.estado === 'Pendiente';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-full">
      <div className="p-4 flex justify-between items-start border-b border-gray-100">
        <div>
          <h3 className="font-bold text-xl text-brand-primary">{pedido.mesaNombre}</h3>
          <div className="flex items-center gap-1 mt-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{pedido.hora}</span>
          </div>
        </div>
        <div className="text-right mt-1">
          <span className={`font-semibold ${isPendiente ? 'text-status-ocupado' : 'text-brand-accent'}`}>
            {pedido.estado}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex-grow">
        <ul className="space-y-3">
          {pedido.items.map(item => (
            <li key={item.id} className={`flex gap-3 items-start ${item.estado === 'Listo' ? 'opacity-40' : ''}`}>
              <div className="font-semibold text-gray-700 w-6">
                {item.cantidad}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`font-medium ${item.estado === 'Listo' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.nombre}
                  </span>
                  {item.estado === 'Pendiente' && pedido.items.some(i => i.estado !== 'Pendiente') && (
                    <span className="text-status-ocupado text-sm font-semibold italic">
                      (Agregado)
                    </span>
                  )}
                </div>
                {item.observaciones && (
                  <p className="mt-0.5 text-sm text-gray-600">
                    * {item.observaciones}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 pt-0 mt-auto">
        {isPendiente ? (
          <button 
            onClick={() => onUpdateStatus(pedido.id, 'Preparando')}
            className="w-full bg-brand-primary text-white py-2.5 min-h-[44px] rounded font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            Comenzar Preparación
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(pedido.id, 'Listo')}
            className="w-full bg-status-disponible text-white py-2.5 min-h-[44px] rounded font-medium shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            <Check className="w-5 h-5" /> Marcar como Listo
          </button>
        )}
      </div>
    </div>
  );
}
