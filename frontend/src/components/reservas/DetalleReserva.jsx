import { useEffect, useRef, useState } from "react";

import {
  Armchair,
  CalendarDays,
  Clock3,
  IdCard,
  MessageSquareText,
  Pencil,
  Phone,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { estadosReserva } from "../../data/reservasData";
import { textoEstado } from "../../utils/reservasUtils";

// `accionEnCurso`: null, "eliminar" o "estado-<valor>" mientras se envía al backend.
// `puedeGestionar`: sin rol de administrador solo se ven los datos (sin estado, editar ni eliminar).
// El padre le pone key={reserva._id} para que la confirmación se reinicie al cambiar de reserva.
export default function DetalleReserva({
  reserva,
  accionEnCurso,
  puedeGestionar,
  onCerrar,
  onCambiarEstado,
  onEditar,
  onEliminar,
}) {
  const [confirmandoEliminar, setConfirmandoEliminar] =
    useState(false);

  const refPanel = useRef(null);
  const hayReserva = Boolean(reserva);

  // El panel está bajo el calendario: si al elegir una reserva
  // no se ve completo, la página se desplaza suavemente hasta él
  useEffect(() => {
    const panel = refPanel.current;

    if (!hayReserva || !panel) return;

    const rect = panel.getBoundingClientRect();

    if (rect.bottom > window.innerHeight) {
      panel.scrollIntoView({
        behavior: "smooth",
        // Si cabe entero, solo lo justo para verlo completo; si no, desde arriba
        block: rect.height < window.innerHeight ? "nearest" : "start",
      });
    }
  }, [hayReserva]);

  if (!reserva) {
    return (
      <aside className="detalle-reserva vacio">

        <div className="encabezado-detalle">
          <h2>Detalle de reserva</h2>
        </div>

        <div className="contenido-detalle">
          <p>
            Selecciona una reserva para ver
            sus detalles.
          </p>
        </div>

      </aside>
    );
  }

  const ocupado = accionEnCurso !== null;

  return (
    <aside
      className={puedeGestionar ? "detalle-reserva" : "detalle-reserva solo-lectura"}
      ref={refPanel}
    >

      <div className="encabezado-detalle">

        <h2>Detalle de reserva</h2>

        <button
          type="button"
          className="cerrar-detalle"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
        >
          <X />
        </button>

      </div>

      <div
        className={`estado-reserva ${reserva.estado}`}
      >
        {textoEstado(reserva.estado)}
      </div>

      <div className="contenido-detalle">

        <div className="avatar-cliente">
          {reserva.cliente
            .split(" ")
            .filter(Boolean)
            .map((palabra) => palabra[0])
            .slice(0, 2)
            .join("")}
        </div>

        <h3>
          {reserva.cliente}
        </h3>

        <p>
          <CalendarDays />
          {reserva.fecha}
        </p>

        <p>
          <Clock3 />
          {reserva.inicio} - {reserva.fin}
        </p>

        <p>
          <UsersRound />
          {reserva.personas} {reserva.personas === 1 ? "persona" : "personas"}
        </p>

        <p>
          <Armchair />
          Mesa {reserva.mesa}
        </p>

        <p>
          <Phone />
          {reserva.telefono}
        </p>

        {reserva.clienteRut && (
          <p>
            <IdCard />
            RUT {reserva.clienteRut}
          </p>
        )}

        {reserva.observaciones && (
          <p>
            <MessageSquareText />
            {reserva.observaciones}
          </p>
        )}

      </div>

      {/* Controles solo para administradores */}
      {puedeGestionar && (
      <>
      {/* Cambiar entre los 4 estados */}
      <div className="cambiar-estado-reserva">

        <h3>Cambiar estado</h3>

        <div className="opciones-estado">
          {estadosReserva.map(({ valor, texto }) => {
            const enviando = accionEnCurso === `estado-${valor}`;

            return (
              <button
                key={valor}
                type="button"
                className={
                  `opcion-estado ${valor}` +
                  (reserva.estado === valor ? " actual" : "")
                }
                aria-pressed={reserva.estado === valor}
                disabled={ocupado || reserva.estado === valor}
                onClick={() => onCambiarEstado(reserva, valor)}
              >
                <span className={`punto-estado ${valor}`} />
                {enviando ? "Guardando..." : texto}
              </button>
            );
          })}
        </div>

      </div>

      <div className="acciones-detalle">

        {confirmandoEliminar ? (

          <div className="confirmar-eliminar" role="alertdialog" aria-labelledby="textoConfirmarEliminar">

            <p id="textoConfirmarEliminar">
              ¿Eliminar la reserva de {reserva.cliente}?
            </p>

            <div className="botones-confirmar-eliminar">
              <button
                type="button"
                className="boton-cambiar-mesa"
                onClick={() => setConfirmandoEliminar(false)}
                disabled={ocupado}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="boton-cancelar-reserva"
                onClick={() => onEliminar(reserva)}
                disabled={ocupado}
              >
                <Trash2 />
                {accionEnCurso === "eliminar" ? "Eliminando..." : "Eliminar"}
              </button>
            </div>

          </div>

        ) : (

          <>
            <button
              type="button"
              className="boton-editar-reserva"
              onClick={() => onEditar(reserva)}
              disabled={ocupado}
            >
              <Pencil />
              Editar
            </button>

            <button
              type="button"
              className="boton-cancelar-reserva"
              onClick={() => setConfirmandoEliminar(true)}
              disabled={ocupado}
            >
              <Trash2 />
              Eliminar
            </button>
          </>

        )}

      </div>
      </>
      )}

    </aside>
  );
}
