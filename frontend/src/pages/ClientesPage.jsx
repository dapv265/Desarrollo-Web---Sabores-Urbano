import { useState } from 'react';
import { clientesData } from '../data/clientesData';

const ClientesPage = () => {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState(clientesData);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  // Estado para guardar los datos del nuevo cliente que se está registrando
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    email: ''
  });

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    cliente.rut.includes(busqueda)
  );

  // Función que se ejecuta al enviar el formulario de registro
  const handleRegistrarCliente = (e) => {
    e.preventDefault(); 
    
    // Armamos el objeto del nuevo cliente 
    const clienteCreado = {
      id: clientes.length + 1, 
      nombre: nuevoCliente.nombre,
      rut: nuevoCliente.rut,
      telefono: nuevoCliente.telefono,
      email: nuevoCliente.email,
      ultimaReserva: 'Sin reservas previas', 
      estado: 'Activo'
    };

    // Actualizamos el estado "clientes" agregando el nuevo cliente al final de la lista
    setClientes([...clientes, clienteCreado]);
    
    // Limpiamos los campos del formulario y cerramos el modal
    setNuevoCliente({ nombre: '', rut: '', telefono: '', email: '' });
    setMostrarModal(false);
  };

  return (
    <div className="page-container relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-brand-primary">
          Gestión de Clientes
        </h1>
        
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          {/* Buscador Interactivo */}
          <input 
            type="text" 
            placeholder="Buscar por nombre o RUT..." 
            className="border p-2 rounded-md w-full md:w-64"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {/* Botón para abrir el formulario de registro */}
          <button 
            className="btn-primary whitespace-nowrap"
            onClick={() => setMostrarModal(true)}
          >
            + Registrar Cliente
          </button>
        </div>
      </div>

      {/* MODAL DE REGISTRO DE CLIENTE */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-brand-primary">
              Registrar Nuevo Cliente
            </h2>
            
            <form onSubmit={handleRegistrarCliente} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Nombre Completo</label>
                <input 
                  type="text" required placeholder="Ej: Juan Pérez"
                  className="border p-2 rounded-md"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">RUT</label>
                <input 
                  type="text" required placeholder="Ej: 12.345.678-9"
                  className="border p-2 rounded-md"
                  value={nuevoCliente.rut}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, rut: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Teléfono</label>
                <input 
                  type="text" required placeholder="+56 9..."
                  className="border p-2 rounded-md"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold">Correo Electrónico</label>
                <input 
                  type="email" required placeholder="correo@ejemplo.com"
                  className="border p-2 rounded-md"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vista Responsiva: Tarjetas en celular, Tabla en Desktop */}
      
      {/* 1. Vista de Tarjetas para Celulares */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {clientesFiltrados.map((cliente) => (
          <div key={cliente.id} className="card flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{cliente.nombre}</h3>
              <span className={`badge ${cliente.estado === 'Activo' ? 'badge-disponible' : 'badge-ocupado'}`}>
                {cliente.estado}
              </span>
            </div>
            <p className="text-sm text-gray-600"><strong>RUT:</strong> {cliente.rut}</p>
            <p className="text-sm text-gray-600"><strong>Tel:</strong> {cliente.telefono}</p>
            <p className="text-sm text-gray-600"><strong>Email:</strong> {cliente.email}</p>
            <p className="text-sm text-gray-600"><strong>Última Reserva:</strong> {cliente.ultimaReserva}</p>
          </div>
        ))}
        {clientesFiltrados.length === 0 && (
          <p className="text-center text-gray-500">No se encontraron clientes.</p>
        )}
      </div>

      {/* 2. Vista de Tabla para Tablets/Desktop */}
      <div className="hidden md:block card">
        <div className="table-responsive">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">RUT</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Última Reserva</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{cliente.nombre}</td>
                    <td className="py-3 px-4 text-sm">{cliente.rut}</td>
                    <td className="py-3 px-4 text-sm">{cliente.telefono}</td>
                    <td className="py-3 px-4 text-sm">{cliente.email}</td>
                    <td className="py-3 px-4 text-sm">{cliente.ultimaReserva}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${cliente.estado === 'Activo' ? 'badge-disponible' : 'badge-ocupado'}`}>
                        {cliente.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ClientesPage;
