import {
  Armchair,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UsersRound,
} from "lucide-react";

import ReservaCard from "./ReservaCard";

export default function CalendarioReservas({
  mesas,
  horarios,
  reservas,
  vista,
  onCambiarVista,
  onNuevaReserva,
  onSeleccionarReserva,
}) {
  const reservasActivas =
    reservas.filter(
      (reserva) => reserva.estado !== "cancelada"
    );

  const mesasOcupadas =
    new Set(
      reservasActivas.map((reserva) => reserva.mesa)
    ).size;

  const ocupacion =
    Math.round((mesasOcupadas / mesas.length) * 100);

  const personasReservadas =
    reservasActivas.reduce(
      (total, reserva) => total + reserva.personas,
      0
    );

  const proximaReserva =
    [...reservasActivas].sort((a, b) =>
      a.inicio.localeCompare(b.inicio)
    )[0];

  return (
    <section className="area-calendario">

      <div className="barra-superior-calendario">

        <div className="navegacion-fecha">

          <button type="button">
            <ChevronLeft />
          </button>

          <h2>
            Viernes, 16 de octubre de 2026
          </h2>

          <button type="button">
            <ChevronRight />
          </button>

        </div>

        <div className="acciones-calendario">

          <div className="botones-vista">

            {["dia", "semana", "mes"].map(
              (tipoVista) => (
                <button
                  key={tipoVista}
                  type="button"
                  className={
                    vista === tipoVista
                      ? "vista-activa"
                      : ""
                  }
                  onClick={() =>
                    onCambiarVista(tipoVista)
                  }
                >
                  {tipoVista.charAt(0).toUpperCase() +
                    tipoVista.slice(1)}
                </button>
              )
            )}

          </div>

          <button
            type="button"
            className="boton-nueva-reserva"
            onClick={onNuevaReserva}
          >
            <CalendarPlus />
            Nueva reserva
          </button>

        </div>

      </div>

      <div className="contenedor-horarios">

        <table className="tabla-horarios">

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

            {horarios.map((hora) => (

              <tr key={hora}>

                <td className="hora">
                  {hora}
                </td>

                {mesas.map((mesa) => {

                  const reserva =
                    reservas.find(
                      (item) =>
                        item.mesa === mesa.id &&
                        item.inicio === hora
                    );

                  return (
                    <td
                      key={mesa.id}
                      className={
                        reserva
                          ? "celda-reserva con-reserva"
                          : "celda-reserva sin-reserva"
                      }
                      data-mesa={`Mesa ${mesa.id}`}
                      data-capacidad={`${mesa.capacidad} pers.`}
                    >

                      {reserva && (
                        <ReservaCard
                          reserva={reserva}
                          onSeleccionar={
                            onSeleccionarReserva
                          }
                        />
                      )}

                    </td>
                  );
                })}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <section className="resumen-calendario">

        <article className="dato-resumen-calendario">
          <Armchair />

          <div>
            <span>Ocupación</span>
            <strong>{ocupacion}%</strong>
          </div>
        </article>

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

        <article className="dato-resumen-calendario proxima-reserva">
          <Clock3 />

          <div>
            <span>Próxima reserva</span>
            <strong>
              {proximaReserva
                ? `${proximaReserva.inicio} · Mesa ${proximaReserva.mesa}`
                : "Sin reservas"}
            </strong>
          </div>
        </article>

      </section>

    </section>
  );
}
