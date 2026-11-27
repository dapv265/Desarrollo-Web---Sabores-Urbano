import { useEffect, useRef, useState } from "react";

import {
  Armchair,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Plus,
  UsersRound,
} from "lucide-react";

import ReservaCard from "./ReservaCard";
import ListaReservas from "./ListaReservas";
import { distribuirReservas } from "../../utils/reservasUtils";

const NOMBRES_VISTA = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
};

export default function CalendarioReservas({
  mesas,
  horarios,
  titulo,
  tituloCorto,
  dias,
  onNavegar,
  onIrAHoy,
  reservas,
  cargando,
  vista,
  onCambiarVista,
  onNuevaReserva,
  reservaSeleccionada,
  onSeleccionarReserva,
}) {
  // Contenedor con scroll de la tabla, para saber si hay más mesas a los lados
  const refHorarios = useRef(null);

  const [desplazamiento, setDesplazamiento] =
    useState({ izquierda: false, derecha: false });

  function medirDesplazamiento(elemento) {
    const izquierda = elemento.scrollLeft > 1;
    const derecha =
      elemento.scrollLeft + elemento.clientWidth < elemento.scrollWidth - 1;

    setDesplazamiento((actual) =>
      actual.izquierda === izquierda && actual.derecha === derecha
        ? actual
        : { izquierda, derecha }
    );
  }

  // Vuelve a medir cuando cambia el tamaño (ventana, filtros de mesas)
  useEffect(() => {
    const elemento = refHorarios.current;

    if (!elemento) return undefined;

    const observador = new ResizeObserver(() =>
      medirDesplazamiento(elemento)
    );

    observador.observe(elemento);

    if (elemento.firstElementChild) {
      observador.observe(elemento.firstElementChild);
    }

    return () => observador.disconnect();
  }, [vista]);

  const reservasActivas =
    reservas.filter(
      (reserva) => reserva.estado !== "cancelada"
    );

  const mesasOcupadas =
    new Set(
      reservasActivas.map((reserva) => reserva.mesa)
    ).size;

  const ocupacion = mesas.length
    ? Math.round((mesasOcupadas / mesas.length) * 100)
    : 0;

  const personasReservadas =
    reservasActivas.reduce(
      (total, reserva) => total + reserva.personas,
      0
    );

  const proximaReserva =
    [...reservasActivas].sort((a, b) =>
      a.inicio.localeCompare(b.inicio)
    )[0];

  // Las reservas activas tienen prioridad sobre las canceladas en la misma franja
  const celdas = distribuirReservas(
    [
      ...reservasActivas,
      ...reservas.filter((reserva) => reserva.estado === "cancelada"),
    ],
    horarios
  );

  const clasesMarco =
    "marco-horarios" +
    (desplazamiento.izquierda ? " desplazada" : "") +
    (desplazamiento.derecha ? " hay-mas-derecha" : "");

  return (
    <section className="area-calendario">

      <div className="barra-superior-calendario">

        <div className="navegacion-fecha">

          <button
            type="button"
            onClick={() => onNavegar(-1)}
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>

          {/* Formato largo o corto según el espacio disponible (CSS) */}
          <h2 aria-label={titulo}>
            <span className="titulo-largo" aria-hidden="true">
              {titulo}
            </span>

            <span className="titulo-corto" aria-hidden="true">
              {tituloCorto}
            </span>
          </h2>

          <button
            type="button"
            onClick={() => onNavegar(1)}
            aria-label="Siguiente"
          >
            <ChevronRight />
          </button>

          <button
            type="button"
            className="boton-hoy"
            onClick={onIrAHoy}
          >
            Hoy
          </button>

        </div>

        <div className="acciones-calendario">

          <div className="botones-vista">

            {Object.entries(NOMBRES_VISTA).map(
              ([tipoVista, nombre]) => (
                <button
                  key={tipoVista}
                  type="button"
                  className={
                    vista === tipoVista
                      ? "vista-activa"
                      : ""
                  }
                  aria-pressed={vista === tipoVista}
                  onClick={() =>
                    onCambiarVista(tipoVista)
                  }
                >
                  {nombre}
                </button>
              )
            )}

          </div>

          <button
            type="button"
            className="boton-nueva-reserva"
            onClick={() => onNuevaReserva()}
          >
            <CalendarPlus />
            Nueva reserva
          </button>

        </div>

      </div>

      <div className={cargando ? "zona-calendario cargando" : "zona-calendario"}>

        {cargando && (
          <p className="indicador-carga" role="status">
            <LoaderCircle />
            Cargando reservas...
          </p>
        )}

        {vista === "dia" ? (

          <div className={clasesMarco}>

            <div
              className="contenedor-horarios"
              ref={refHorarios}
              onScroll={(evento) => medirDesplazamiento(evento.currentTarget)}
            >

              <table
                className="tabla-horarios"
                style={{ "--cantidad-mesas": mesas.length }}
              >

                <thead>
                  <tr>

                    <th>Hora</th>

                    {mesas.map((mesa) => (
                      <th key={mesa.id}>
                        Mesa {mesa.id}

                        <small>
                          {mesa.capacidad} pers.
                        </small>
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody>

                  {horarios.map((hora, indiceFila) => (

                    <tr key={hora}>

                      <td className="hora">
                        {hora}
                      </td>

                      {mesas.map((mesa) => {

                        const celda = celdas.get(`${mesa.id}|${indiceFila}`);
                        const atributosMovil = {
                          "data-mesa": `Mesa ${mesa.id}`,
                          "data-capacidad": `${mesa.capacidad} pers.`,
                        };

                        // Bloque continuo: la celda de inicio ocupa todas sus franjas
                        if (celda?.tipo === "inicio") {
                          return (
                            <td
                              key={mesa.id}
                              rowSpan={celda.filas}
                              className="celda-reserva con-reserva"
                              {...atributosMovil}
                            >
                              <ReservaCard
                                reserva={celda.reserva}
                                onSeleccionar={onSeleccionarReserva}
                              />
                            </td>
                          );
                        }

                        // Franja tapada por el bloque: oculta en escritorio,
                        // visible en móvil (donde la tabla se muestra como lista)
                        if (celda?.tipo === "cubierta") {
                          return (
                            <td
                              key={mesa.id}
                              className="celda-reserva celda-cubierta"
                              {...atributosMovil}
                            >
                              <button
                                type="button"
                                className={`continuacion-reserva ${celda.reserva.estado}`}
                                onClick={() => onSeleccionarReserva(celda.reserva)}
                              >
                                {celda.reserva.cliente} · hasta {celda.reserva.fin}
                              </button>
                            </td>
                          );
                        }

                        // Celda libre: abre el modal con mesa y hora elegidas
                        return (
                          <td
                            key={mesa.id}
                            className="celda-reserva sin-reserva"
                            {...atributosMovil}
                          >
                            <button
                              type="button"
                              className="boton-celda-vacia"
                              onClick={() =>
                                onNuevaReserva({ mesa: mesa.id, hora })
                              }
                              aria-label={`Nueva reserva en mesa ${mesa.id} a las ${hora}`}
                              title={`Reservar mesa ${mesa.id} a las ${hora}`}
                            >
                              <Plus />
                            </button>
                          </td>
                        );
                      })}

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        ) : (

          <ListaReservas
            dias={dias}
            reservas={reservas}
            mostrarDiasVacios={vista === "semana"}
            reservaSeleccionada={reservaSeleccionada}
            onSeleccionarReserva={onSeleccionarReserva}
          />

        )}

      </div>

      <section className="resumen-calendario">

        {vista === "dia" && (
          <article className="dato-resumen-calendario">
            <Armchair />

            <div>
              <span>Ocupación</span>
              <strong>{ocupacion}%</strong>
            </div>
          </article>
        )}

        <article className="dato-resumen-calendario">
          <CalendarPlus />

          <div>
            <span>Reservas activas</span>
            <strong>{reservasActivas.length}</strong>
          </div>
        </article>

        <article className="dato-resumen-calendario">
          <UsersRound />

          <div>
            <span>Personas</span>
            <strong>{personasReservadas}</strong>
          </div>
        </article>

        {vista === "dia" && (
          <article className="dato-resumen-calendario proxima-reserva">
            <Clock3 />

            <div>
              <span>Próxima reserva</span>
              <strong
                title={proximaReserva
                  ? `${proximaReserva.inicio} · Mesa ${proximaReserva.mesa}`
                  : undefined}
              >
                {proximaReserva
                  ? `${proximaReserva.inicio} · Mesa ${proximaReserva.mesa}`
                  : "Sin reservas"}
              </strong>
            </div>
          </article>
        )}

      </section>

    </section>
  );
}
