import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import MesaCard from "../components/MesaCard";
import { ZONAS } from "../data/mesasData";

import {
  obtenerDisponibilidad,
  obtenerRestaurantes,
  actualizarEstadoMesa,
} from "../services/mesasService";

const HORARIOS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const FILTROS_INICIALES = {
  personas: "",
  fecha: "",
  hora: "",
  duracion: "90",
  zona: "todas",
  restauranteCodigo: "todos",
};

const CLASE_CAMPO =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";

export default function DisponibilidadPage() {
  const { session } = useAuth();
  const token = session?.token;
  const [mesas, setMesas] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [errorRestaurantes, setErrorRestaurantes] = useState("");
  const [cargandoRestaurantes, setCargandoRestaurantes] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const [filtros, setFiltros] = useState({
    ...FILTROS_INICIALES,
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    ...FILTROS_INICIALES,
  });

  const hoy = new Date();
  const fechaMinima = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");

  // Cargar disponibilidad inmediata
  useEffect(() => {
    let activo = true;

    obtenerRestaurantes()
      .then((datos) => { if (activo) setRestaurantes(datos); })
      .catch((err) => { if (activo) setErrorRestaurantes(err.message); })
      .finally(() => { if (activo) setCargandoRestaurantes(false); });

    obtenerDisponibilidad()
      .then((datos) => {
        if (activo) {
          setMesas(datos.mesas);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  // Modificar los filtros del formulario
  function cambiarFiltro(campo, valor) {
    setFiltros((anteriores) => ({
      ...anteriores,
      [campo]: valor,
    }));
  }

  // Consultar disponibilidad desde el backend
  async function consultarDisponibilidad(nuevosFiltros) {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerDisponibilidad(nuevosFiltros);

      setMesas(datos.mesas);
      setFiltrosAplicados({ ...nuevosFiltros });
    } catch (err) {
      setMesas([]);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  // Buscar mesas según los filtros seleccionados
  async function buscarMesas(evento) {
    evento.preventDefault();

    if (
      (filtros.fecha && !filtros.hora) ||
      (!filtros.fecha && filtros.hora)
    ) {
      setError("Debes seleccionar una fecha y una hora.");
      return;
    }

    if (filtros.fecha && filtros.fecha < fechaMinima) {
      setError("No puedes seleccionar una fecha pasada.");
      return;
    }

    if (filtros.personas) {
      const personas = Number(filtros.personas);

      if (!Number.isInteger(personas) || personas < 1) {
        setError("Ingresa una cantidad válida de personas.");
        return;
      }
    }

    await consultarDisponibilidad(filtros);
  }

  // Limpiar filtros y volver a disponibilidad inmediata
  async function limpiarFiltros() {
    const iniciales = { ...FILTROS_INICIALES };

    setFiltros(iniciales);
    await consultarDisponibilidad(iniciales);
  }

  // Actualizar resultados manteniendo los filtros aplicados
  async function refrescarDisponibilidad() {
    await consultarDisponibilidad(filtrosAplicados);
  }

  // Actualizar estado de una mesa en MongoDB
  async function cambiarEstado(numero, nuevoEstado) {
    const mesa = mesas.find((m) => m.numero === numero);

    if (!mesa || actualizando || cargando) return;

    setActualizando(true);
    setError("");

    try {
      await actualizarEstadoMesa(mesa.id, nuevoEstado, token);

      const datos = await obtenerDisponibilidad(
        filtrosAplicados
      );

      setMesas(datos.mesas);
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  }

  const ocupado = cargando || actualizando;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">

      <h1
        className="mb-2 text-2xl font-bold"
        style={{ fontFamily: "var(--font-headings)" }}
      >
        Disponibilidad de Mesas
      </h1>

      <p className="mb-6 text-gray-600">
        Consulta las mesas disponibles según cantidad de
        personas, restaurante, ubicación, fecha, horario y reservas (RF5).
      </p>

      {/* Formulario de búsqueda */}
      <form
        onSubmit={buscarMesas}
        className="mb-6 rounded-xl border border-gray-200
                   bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">
          Filtros de disponibilidad
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Restaurante */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Restaurante</span>
            <select
              value={filtros.restauranteCodigo}
              onChange={(e) => cambiarFiltro("restauranteCodigo", e.target.value)}
              disabled={ocupado || cargandoRestaurantes}
              className={CLASE_CAMPO}
            >
              <option value="todos">Todos los restaurantes</option>
              {restaurantes.map((restaurante) => (
                <option key={restaurante.codigo} value={restaurante.codigo}>
                  {restaurante.nombre} ({restaurante.estado})
                </option>
              ))}
            </select>
            {cargandoRestaurantes ? (
              <p className="mt-1 text-xs text-gray-500">Cargando restaurantes...</p>
            ) : errorRestaurantes ? (
              <p role="alert" className="mt-1 text-xs text-red-700">{errorRestaurantes}</p>
            ) : restaurantes.length === 0 ? (
              <p className="mt-1 text-xs text-gray-500">No hay restaurantes registrados.</p>
            ) : null}
          </label>

          {/* Cantidad de personas */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Cantidad de personas
            </span>

            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ej: 4"
              value={filtros.personas}
              onChange={(e) =>
                cambiarFiltro("personas", e.target.value)
              }
              disabled={ocupado}
              className={CLASE_CAMPO}
            />
          </label>

          {/* Ubicación */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Ubicación
            </span>

            <select
              value={filtros.zona}
              onChange={(e) =>
                cambiarFiltro("zona", e.target.value)
              }
              disabled={ocupado}
              className={CLASE_CAMPO}
            >
              <option value="todas">
                Todas las zonas
              </option>

              {ZONAS.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </label>

          {/* Fecha */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Fecha
            </span>

            <input
              type="date"
              min={fechaMinima}
              value={filtros.fecha}
              onChange={(e) =>
                cambiarFiltro("fecha", e.target.value)
              }
              disabled={ocupado}
              className={CLASE_CAMPO}
            />
          </label>

          {/* Hora */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Hora
            </span>

            <select
              value={filtros.hora}
              onChange={(e) =>
                cambiarFiltro("hora", e.target.value)
              }
              disabled={ocupado}
              className={CLASE_CAMPO}
            >
              <option value="">
                Seleccionar horario
              </option>

              {HORARIOS.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))}
            </select>
          </label>

          {/* Duración */}
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Duración estimada
            </span>

            <select
              value={filtros.duracion}
              onChange={(e) =>
                cambiarFiltro("duracion", e.target.value)
              }
              disabled={ocupado}
              className={CLASE_CAMPO}
            >
              <option value="30">30 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </label>

        </div>

        <p className="mt-4 text-xs text-gray-500">
          Si no seleccionas fecha ni hora, se consultará
          la disponibilidad inmediata.
        </p>

        {/* Botones */}
        <div className="mt-5 flex flex-wrap gap-3">

          <button
            type="submit"
            disabled={ocupado}
            className="rounded-lg px-4 py-2 text-sm
                       font-semibold text-white
                       disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-brand-primary)",
            }}
          >
            Buscar mesas disponibles
          </button>

          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={ocupado}
            className="rounded-lg border border-gray-300
                       px-4 py-2 text-sm font-semibold
                       hover:bg-gray-100 disabled:opacity-50"
          >
            Limpiar filtros
          </button>

          <button
            type="button"
            onClick={refrescarDisponibilidad}
            disabled={ocupado}
            className="rounded-lg bg-gray-800 px-4 py-2
                       text-sm font-semibold text-white
                       hover:bg-gray-700 disabled:opacity-50"
          >
            Actualizar disponibilidad
          </button>

        </div>
      </form>

      {/* Mensajes */}
      {cargando && (
        <p className="mb-4 text-gray-600">
          Consultando disponibilidad...
        </p>
      )}

      {actualizando && (
        <p className="mb-4 text-gray-600">
          Actualizando estado de la mesa...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-100 p-3
                     text-red-700"
        >
          {error}
        </p>
      )}

      {/* Resultados */}
      {!cargando && !error && (
        <div className="mb-4 rounded-lg bg-green-50 p-4">

          <p className="font-semibold text-green-800">
            Mesas disponibles: {mesas.length}
          </p>

          <p className="mt-1 text-sm text-green-700">
            {filtrosAplicados.fecha
              ? `Fecha: ${filtrosAplicados.fecha} | Hora: ${filtrosAplicados.hora} | Duración: ${filtrosAplicados.duracion} minutos`
              : "Disponibilidad inmediata"}

            {filtrosAplicados.personas
              ? ` | Personas: ${filtrosAplicados.personas}`
              : ""}

            {filtrosAplicados.restauranteCodigo !== "todos"
              ? ` | Restaurante: ${restaurantes.find((r) => r.codigo === filtrosAplicados.restauranteCodigo)?.nombre || filtrosAplicados.restauranteCodigo}`
              : ""}

            {filtrosAplicados.zona !== "todas"
              ? ` | Zona: ${filtrosAplicados.zona}`
              : ""}
          </p>

        </div>
      )}

      {!cargando && !error && mesas.length === 0 && (
        <p className="rounded-lg bg-gray-100 p-4 text-gray-600">
          No hay mesas disponibles para los filtros
          seleccionados. Intenta modificar la búsqueda.
        </p>
      )}

      {!cargando && !error && (
        <fieldset disabled={actualizando}>
          <div className="grid grid-cols-1 gap-4
                          md:grid-cols-2 lg:grid-cols-3">

            {mesas.map((mesa) => (
              <MesaCard
                key={mesa.id}
                numero={mesa.numero}
                zona={mesa.zona}
                capacidad={mesa.capacidad}
                estado={mesa.estado}
                onCambiarEstado={cambiarEstado}
              />
            ))}

          </div>
        </fieldset>
      )}

    </main>
  );
}
