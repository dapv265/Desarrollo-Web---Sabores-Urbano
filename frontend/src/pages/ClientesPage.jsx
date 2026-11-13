import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { ROLES_CLIENTES_GESTION } from "../auth/roles";
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  obtenerClientes,
} from "../services/clientesService";

const FORMULARIO_VACIO = {
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  estado: "Activo",
};

function mensajeDeError(error) {
  const detalles = error.errors
    ?.map((item) => item.message)
    .filter(Boolean)
    .join(" ");

  return detalles ? `${error.message} ${detalles}` : error.message;
}

function estadoVisible(cliente) {
  return cliente.activo === false ? "Inactivo" : cliente.estado || "Activo";
}

const ClientesPage = () => {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(FORMULARIO_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const puedeGestionar = ROLES_CLIENTES_GESTION.includes(session.usuario.rol);

  const manejarNoAutorizado = useCallback(
    (requestError) => {
      if (requestError.status !== 401) {
        return false;
      }

      signOut();
      navigate("/login", {
        replace: true,
        state: {
          from: "/clientes",
          message: "Tu sesión expiró. Inicia sesión nuevamente.",
        },
      });
      return true;
    },
    [navigate, signOut],
  );

  useEffect(() => {
    let cancelled = false;

    obtenerClientes(session.token)
      .then((data) => {
        if (!cancelled) {
          setClientes(data);
        }
      })
      .catch((requestError) => {
        if (!cancelled && !manejarNoAutorizado(requestError)) {
          setError(mensajeDeError(requestError));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCargando(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [manejarNoAutorizado, session.token]);

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return clientes.filter(
      (cliente) =>
        (cliente.nombre || "").toLowerCase().includes(termino) ||
        (cliente.rut || "").toLowerCase().includes(termino),
    );
  }, [busqueda, clientes]);

  const abrirFormulario = (cliente = null) => {
    setClienteEditando(cliente);
    setNuevoCliente(
      cliente
        ? {
            nombre: cliente.nombre || "",
            rut: cliente.rut || "",
            telefono: cliente.telefono || "",
            email: cliente.email || "",
            estado: estadoVisible(cliente),
          }
        : FORMULARIO_VACIO,
    );
    setErrorFormulario("");
    setMostrarModal(true);
  };

  const cerrarFormulario = () => {
    setMostrarModal(false);
    setClienteEditando(null);
    setNuevoCliente(FORMULARIO_VACIO);
    setErrorFormulario("");
  };

  const handleGuardarCliente = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setErrorFormulario("");
    setMensaje("");

    const datos = {
      nombre: nuevoCliente.nombre.trim(),
      rut: nuevoCliente.rut.trim(),
      telefono: nuevoCliente.telefono.trim(),
      email: nuevoCliente.email.trim(),
    };

    if (clienteEditando) {
      datos.estado = nuevoCliente.estado;
    }

    try {
      if (clienteEditando) {
        const actualizado = await actualizarCliente(
          session.token,
          clienteEditando.id,
          datos,
        );
        setClientes((actuales) =>
          actuales.map((cliente) =>
            cliente.id === actualizado.id ? actualizado : cliente,
          ),
        );
        setMensaje("Cliente actualizado correctamente.");
      } else {
        const creado = await crearCliente(session.token, datos);
        setClientes((actuales) =>
          [...actuales, creado].sort((a, b) => a.id - b.id),
        );
        setMensaje("Cliente registrado correctamente.");
      }

      cerrarFormulario();
    } catch (requestError) {
      if (!manejarNoAutorizado(requestError)) {
        setErrorFormulario(mensajeDeError(requestError));
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarCliente = async (cliente) => {
    if (
      !window.confirm(
        `¿Marcar a ${cliente.nombre} como inactivo? El registro se conservará.`,
      )
    ) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const actualizado = await eliminarCliente(session.token, cliente.id);
      setClientes((actuales) =>
        actuales.map((item) =>
          item.id === actualizado.id ? actualizado : item,
        ),
      );
      setMensaje("Cliente marcado como inactivo.");
    } catch (requestError) {
      if (!manejarNoAutorizado(requestError)) {
        setError(mensajeDeError(requestError));
      }
    } finally {
      setGuardando(false);
    }
  };

  const accionesCliente = (cliente) =>
    puedeGestionar ? (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
          onClick={() => abrirFormulario(cliente)}
          disabled={guardando}
        >
          Editar
        </button>
        {cliente.activo !== false && (
          <button
            type="button"
            className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
            onClick={() => handleEliminarCliente(cliente)}
            disabled={guardando}
          >
            Desactivar
          </button>
        )}
      </div>
    ) : null;

  return (
    <div className="page-container relative">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h1 className="text-2xl font-bold text-brand-primary">
          Gestión de Clientes
        </h1>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <input
            type="search"
            aria-label="Buscar clientes por nombre o RUT"
            placeholder="Buscar por nombre o RUT..."
            className="w-full rounded-md border p-2 md:w-64"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
          {puedeGestionar && (
            <button
              type="button"
              className="btn-primary whitespace-nowrap"
              onClick={() => abrirFormulario()}
            >
              + Registrar Cliente
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {mensaje && (
        <p
          className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {mensaje}
        </p>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="card relative w-full max-w-md bg-white p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cliente-modal-title"
          >
            <h2
              id="cliente-modal-title"
              className="mb-4 text-xl font-bold text-brand-primary"
            >
              {clienteEditando ? "Editar Cliente" : "Registrar Nuevo Cliente"}
            </h2>

            {errorFormulario && (
              <p
                className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {errorFormulario}
              </p>
            )}

            <form
              onSubmit={handleGuardarCliente}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cliente-nombre"
                  className="text-sm font-semibold"
                >
                  Nombre Completo
                </label>
                <input
                  id="cliente-nombre"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ej: Juan Pérez"
                  className="rounded-md border p-2"
                  value={nuevoCliente.nombre}
                  onChange={(event) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      nombre: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="cliente-rut" className="text-sm font-semibold">
                  RUT
                </label>
                <input
                  id="cliente-rut"
                  type="text"
                  required
                  placeholder="Ej: 12.345.678-9"
                  className="rounded-md border p-2"
                  value={nuevoCliente.rut}
                  onChange={(event) =>
                    setNuevoCliente({ ...nuevoCliente, rut: event.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cliente-telefono"
                  className="text-sm font-semibold"
                >
                  Teléfono
                </label>
                <input
                  id="cliente-telefono"
                  type="tel"
                  required
                  placeholder="+56 9..."
                  className="rounded-md border p-2"
                  value={nuevoCliente.telefono}
                  onChange={(event) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      telefono: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cliente-email"
                  className="text-sm font-semibold"
                >
                  Correo Electrónico
                </label>
                <input
                  id="cliente-email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  className="rounded-md border p-2"
                  value={nuevoCliente.email}
                  onChange={(event) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      email: event.target.value,
                    })
                  }
                />
              </div>

              {clienteEditando && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cliente-estado"
                    className="text-sm font-semibold"
                  >
                    Estado
                  </label>
                  <select
                    id="cliente-estado"
                    className="rounded-md border p-2"
                    value={nuevoCliente.estado}
                    onChange={(event) =>
                      setNuevoCliente({
                        ...nuevoCliente,
                        estado: event.target.value,
                      })
                    }
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : clienteEditando
                      ? "Guardar Cambios"
                      : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="py-8 text-center text-gray-600" role="status">
          Cargando clientes...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {clientesFiltrados.map((cliente) => {
              const estado = estadoVisible(cliente);
              return (
                <div key={cliente.id} className="card flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">{cliente.nombre}</h2>
                    <span
                      className={`badge ${estado === "Activo" ? "badge-disponible" : "badge-ocupado"}`}
                    >
                      {estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>RUT:</strong> {cliente.rut}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Tel:</strong> {cliente.telefono}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {cliente.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Última Reserva:</strong>{" "}
                    {cliente.ultimaReserva || "Sin reservas previas"}
                  </p>
                  {accionesCliente(cliente)}
                </div>
              );
            })}
            {clientesFiltrados.length === 0 && (
              <p className="text-center text-gray-500">
                No se encontraron clientes.
              </p>
            )}
          </div>

          <div className="card hidden md:block">
            <div className="table-responsive">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">RUT</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Última Reserva</th>
                    <th className="px-4 py-3">Estado</th>
                    {puedeGestionar && <th className="px-4 py-3">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => {
                    const estado = estadoVisible(cliente);
                    return (
                      <tr
                        key={cliente.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {cliente.nombre}
                        </td>
                        <td className="px-4 py-3 text-sm">{cliente.rut}</td>
                        <td className="px-4 py-3 text-sm">
                          {cliente.telefono}
                        </td>
                        <td className="px-4 py-3 text-sm">{cliente.email}</td>
                        <td className="px-4 py-3 text-sm">
                          {cliente.ultimaReserva || "Sin reservas previas"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${estado === "Activo" ? "badge-disponible" : "badge-ocupado"}`}
                          >
                            {estado}
                          </span>
                        </td>
                        {puedeGestionar && (
                          <td className="px-4 py-3">
                            {accionesCliente(cliente)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {clientesFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={puedeGestionar ? 7 : 6}
                        className="py-4 text-center text-gray-500"
                      >
                        No se encontraron clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientesPage;
