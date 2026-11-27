import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ROLES } from "../auth/roles";
import { ZONAS, ESTADOS } from "../data/mesasData";
import MesaCard from "../components/MesaCard";
import {
  obtenerMesas,
  obtenerRestaurantes,
  actualizarEstadoMesa,
  crearMesa,
  actualizarMesa,
  eliminarMesa,
} from "../services/mesasService";

const ROLES_GESTION_MESAS = [ROLES.ADMIN_GENERAL, ROLES.ADMIN_LOCAL];

const formularioInicial = {
  restauranteCodigo: "",
  numero: "",
  zona: "Terraza",
  capacidad: 4,
  estado: "disponible",
};

export default function MesasPage() {
  const { session } = useAuth();
  const token = session?.token;
  const puedeGestionarMesas = ROLES_GESTION_MESAS.includes(session?.usuario?.rol);

  const [mesas, setMesas] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [errorRestaurantes, setErrorRestaurantes] = useState("");
  const [filtroZona, setFiltroZona] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mesaEditando, setMesaEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  useEffect(() => {
    async function cargarMesas() {
      try {
        const datos = await obtenerMesas();
        setMesas(datos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarMesas();
    obtenerRestaurantes()
      .then(setRestaurantes)
      .catch((err) => setErrorRestaurantes(err.message));
  }, []);

  const mesasFiltradas = mesas.filter((mesa) =>
    filtroZona === "todas" ? true : mesa.zona === filtroZona
  );

  function abrirNuevaMesa() {
    setMesaEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function abrirEdicion(mesa) {
    setMesaEditando(mesa.id);
    setFormulario({
      restauranteCodigo: mesa.restauranteCodigo ?? "",
      numero: mesa.numero,
      zona: mesa.zona,
      capacidad: mesa.capacidad,
      estado: mesa.estado,
    });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setMesaEditando(null);
    setFormulario({ ...formularioInicial });
  }

  function cambiarCampo(e) {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function guardarMesa(e) {
    e.preventDefault();

    if (actualizando) return;

    try {
      setActualizando(true);
      setError("");
      setMensaje("");

      const datos = {
        ...formulario,
        restauranteCodigo: formulario.restauranteCodigo || null,
        numero: formulario.numero.trim().toUpperCase(),
        capacidad: Number(formulario.capacidad),
      };

      if (mesaEditando) {
        const mesa = await actualizarMesa(mesaEditando, datos, token);

        setMesas((actuales) =>
          actuales.map((m) => m.id === mesa.id ? mesa : m)
        );

        setMensaje("Mesa actualizada correctamente.");
      } else {
        const mesa = await crearMesa(datos, token);

        setMesas((actuales) => [...actuales, mesa]);

        setMensaje("Mesa creada correctamente.");
      }

      cerrarFormulario();
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    if (actualizando) return;

    try {
      setError("");
      setMensaje("");
      setActualizando(true);

      const mesa = await actualizarEstadoMesa(id, nuevoEstado, token);

      setMesas((actuales) =>
        actuales.map((m) => m.id === id ? mesa : m)
      );

      setMensaje("Estado actualizado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  }

  async function borrarMesa(mesa) {
    if (actualizando) return;

    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la mesa ${mesa.numero}?`
    );

    if (!confirmar) return;

    try {
      setActualizando(true);
      setError("");
      setMensaje("");

      await eliminarMesa(mesa.id, token);

      setMesas((actuales) =>
        actuales.filter((m) => m.id !== mesa.id)
      );

      setMensaje("Mesa eliminada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="mb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--font-headings)" }}
          >
            Mapa de mesas
          </h1>

          <p className="text-gray-600">
            {puedeGestionarMesas
              ? "Administra restaurante, número, zona, capacidad y estado de cada mesa (RF3)."
              : "Consulta la ubicación, capacidad y estado actual de las mesas del salón (RF3)."}
          </p>
        </div>

        {puedeGestionarMesas && (
          <button
            type="button"
            onClick={abrirNuevaMesa}
            disabled={actualizando || cargando}
            className="rounded bg-[var(--color-brand-primary)] px-4 py-2 text-white disabled:opacity-50"
          >
            + Nueva mesa
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700"
        >
          {error}
        </div>
      )}

      {errorRestaurantes && (
        <p role="alert" className="mb-4 text-amber-700">{errorRestaurantes}</p>
      )}

      {mensaje && (
        <div
          role="status"
          className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700"
        >
          {mensaje}
        </div>
      )}

      {cargando && (
        <p className="mb-4 text-gray-600">Cargando mesas...</p>
      )}

      {actualizando && (
        <p className="mb-4 text-gray-600">Procesando operación...</p>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={guardarMesa}
          className="mb-6 rounded-lg border bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-xl font-bold">
            {mesaEditando ? "Editar mesa" : "Nueva mesa"}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              Restaurante
              <select
                name="restauranteCodigo"
                value={formulario.restauranteCodigo}
                onChange={cambiarCampo}
                disabled={Boolean(errorRestaurantes) || actualizando}
                className="rounded border p-2"
              >
                <option value="">Sin restaurante asignado</option>
                {formulario.restauranteCodigo &&
                  !restaurantes.some((r) => r.codigo === formulario.restauranteCodigo) && (
                    <option value={formulario.restauranteCodigo}>
                      {formulario.restauranteCodigo} (no disponible en listado)
                    </option>
                  )}
                {restaurantes.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.nombre} ({r.codigo})
                  </option>
                ))}
              </select>
              {!restaurantes.length && !errorRestaurantes && (
                <span className="text-sm text-gray-500">
                  No hay restaurantes registrados.
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1">
              Número de mesa
              <input
                name="numero"
                value={formulario.numero}
                onChange={cambiarCampo}
                placeholder="Ej: T-14"
                pattern="[A-Za-z]-[0-9]{2}"
                maxLength={4}
                required
                className="rounded border p-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              Ubicación
              <select
                name="zona"
                value={formulario.zona}
                onChange={cambiarCampo}
                className="rounded border p-2"
              >
                {ZONAS.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              Capacidad
              <input
                type="number"
                name="capacidad"
                min="1"
                step="1"
                required
                value={formulario.capacidad}
                onChange={cambiarCampo}
                className="rounded border p-2"
              />
            </label>

            <label className="flex flex-col gap-1">
              Estado
              <select
                name="estado"
                value={formulario.estado}
                onChange={cambiarCampo}
                className="rounded border p-2"
              >
                {Object.entries(ESTADOS).map(([clave, estado]) => (
                  <option key={clave} value={clave}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={actualizando}
              className="rounded bg-[var(--color-brand-primary)] px-4 py-2 text-white disabled:opacity-50"
            >
              Guardar mesa
            </button>

            <button
              type="button"
              onClick={cerrarFormulario}
              disabled={actualizando}
              className="rounded border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {["todas", ...ZONAS].map((zona) => (
          <button
            key={zona}
            onClick={() => setFiltroZona(zona)}
            className={`rounded border px-3 py-1 text-sm ${
              filtroZona === zona
                ? "bg-[var(--color-brand-primary)] text-white"
                : "bg-white"
            }`}
          >
            {zona === "todas" ? "Todas" : zona}
          </button>
        ))}
      </div>

      {!cargando && mesasFiltradas.length === 0 && (
        <p className="mb-4 text-gray-500">
          No hay mesas para mostrar.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mesasFiltradas.map((mesa) => (
          <div key={mesa.id}>
            <MesaCard
              numero={mesa.numero}
              zona={mesa.zona}
              capacidad={mesa.capacidad}
              estado={mesa.estado}
              onCambiarEstado={(_, estado) =>
                cambiarEstado(mesa.id, estado)
              }
            />

            <p className="mt-2 text-sm text-gray-600">
              Restaurante: {mesa.restauranteCodigo
                ? restaurantes.find((r) => r.codigo === mesa.restauranteCodigo)?.nombre
                  ?? mesa.restauranteCodigo
                : "Sin restaurante asignado"}
            </p>

            {puedeGestionarMesas && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => abrirEdicion(mesa)}
                  disabled={actualizando || mostrarFormulario}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                >
                  Editar
                </button>

                <button
                  onClick={() => borrarMesa(mesa)}
                  disabled={actualizando || mostrarFormulario}
                  className="flex-1 rounded border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        {mesasFiltradas.length} de {mesas.length} mesas mostradas.
      </p>
    </main>
  );
}
