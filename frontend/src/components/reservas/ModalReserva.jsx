import { useState } from "react";

import {
  Armchair,
  Calendar,
  CalendarPlus,
  Clock,
  HeartHandshake,
  MessageSquareText,
  Phone,
  Timer,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  comprobarDisponibilidadReserva,
  calcularHoraFinal,
} from "../../utils/reservasUtils";

export default function ModalReserva({
  abierto,
  reservas,
  onCerrar,
  onCrearReserva,
}) {
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [personas, setPersonas] = useState("2");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [mesa, setMesa] = useState("1");
  const [observaciones, setObservaciones] =
    useState("");

  const [mensajeDisponibilidad, setMensajeDisponibilidad] =
    useState({
      disponible: null,
      mensaje:
        "Seleccione fecha, hora y mesa para comprobar disponibilidad.",
    });

  if (!abierto) {
    return null;
  }

  function comprobarDisponibilidad() {
    const resultado =
      comprobarDisponibilidadReserva({
        reservas,
        fecha,
        hora,
        mesa,
        duracion,
      });

    setMensajeDisponibilidad(resultado);

    return resultado;
  }

  function manejarSubmit(evento) {
    evento.preventDefault();

    const resultado =
      comprobarDisponibilidad();

    if (!resultado.disponible) {
      return;
    }

    const nuevaReserva = {
      id: Date.now(),
      cliente,
      telefono,
      personas: Number(personas),
      fecha,
      inicio: hora,
      fin: calcularHoraFinal(
        hora,
        duracion
      ),
      mesa: Number(mesa),
      observaciones,
      estado: "confirmada",
    };

    onCrearReserva(nuevaReserva);

    limpiarFormulario();

    onCerrar();
  }

  function limpiarFormulario() {
    setCliente("");
    setTelefono("");
    setPersonas("2");
    setFecha("");
    setHora("");
    setDuracion("60");
    setMesa("1");
    setObservaciones("");

    setMensajeDisponibilidad({
      disponible: null,
      mensaje:
        "Seleccione fecha, hora y mesa para comprobar disponibilidad.",
    });
  }

  function manejarCerrar() {
    limpiarFormulario();
    onCerrar();
  }

  return (
    <div
      className="fondo-modal activo"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) {
          manejarCerrar();
        }
      }}
    >
      <section className="modal-reserva">

        <div className="encabezado-modal">

          <div className="titulo-modal">

            <div className="icono-modal">
              <CalendarPlus />
            </div>

            <div>
              <h2>Nueva reserva</h2>

              <p>
                Registra los datos del cliente y
                comprueba la disponibilidad.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={manejarCerrar}
          >
            <X />
          </button>

        </div>

        <form
          className="formulario-reserva"
          onSubmit={manejarSubmit}
        >

          <div className="grupo-formulario campo-completo">

            <label htmlFor="nombreCliente">
              <UserRound />
              Cliente
            </label>

            <input
              id="nombreCliente"
              type="text"
              placeholder="Nombre del cliente"
              value={cliente}
              onChange={(evento) =>
                setCliente(evento.target.value)
              }
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="telefonoCliente">
              <Phone />
              Teléfono
            </label>

            <input
              id="telefonoCliente"
              type="tel"
              placeholder="+56 9..."
              value={telefono}
              onChange={(evento) =>
                setTelefono(evento.target.value)
              }
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="personasReserva">
              <UsersRound />
              Personas
            </label>

            <select
              id="personasReserva"
              value={personas}
              onChange={(evento) =>
                setPersonas(evento.target.value)
              }
            >
              <option value="2">
                2 personas
              </option>

              <option value="4">
                4 personas
              </option>

              <option value="6">
                6 personas
              </option>
            </select>

          </div>

          <div className="grupo-formulario">

            <label htmlFor="fechaReserva">
              <Calendar />
              Fecha
            </label>

            <input
              id="fechaReserva"
              type="date"
              value={fecha}
              onChange={(evento) => {
                setFecha(evento.target.value);
              }}
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="horaReserva">
              <Clock />
              Hora
            </label>

            <input
              id="horaReserva"
              type="time"
              value={hora}
              onChange={(evento) =>
                setHora(evento.target.value)
              }
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="duracionReserva">
              <Timer />
              Duración
            </label>

            <select
              id="duracionReserva"
              value={duracion}
              onChange={(evento) =>
                setDuracion(evento.target.value)
              }
            >
              <option value="60">
                1 hora
              </option>

              <option value="90">
                1 hora 30 minutos
              </option>

              <option value="120">
                2 horas
              </option>
            </select>

          </div>

          <div className="grupo-formulario">

            <label htmlFor="mesaReserva">
              <Armchair />
              Mesa
            </label>

            <select
              id="mesaReserva"
              value={mesa}
              onChange={(evento) =>
                setMesa(evento.target.value)
              }
            >
              <option value="1">
                Mesa 1 - 2 personas
              </option>

              <option value="2">
                Mesa 2 - 2 personas
              </option>

              <option value="3">
                Mesa 3 - 4 personas
              </option>

              <option value="4">
                Mesa 4 - 4 personas
              </option>

              <option value="5">
                Mesa 5 - 6 personas
              </option>

              <option value="6">
                Mesa 6 - 6 personas
              </option>
            </select>

          </div>

          <div className="grupo-formulario campo-completo">

            <label htmlFor="observacionesReserva">
              <MessageSquareText />
              Observaciones
            </label>

            <textarea
              id="observacionesReserva"
              rows="3"
              placeholder="Ej: mesa cerca de la ventana"
              value={observaciones}
              onChange={(evento) =>
                setObservaciones(
                  evento.target.value
                )
              }
            />

          </div>

          <div
            className={
              "mensaje-disponibilidad campo-completo " +
              (
                mensajeDisponibilidad.disponible === true
                  ? "disponible"
                  : mensajeDisponibilidad.disponible === false
                    ? "no-disponible"
                    : ""
              )
            }
          >
            <span>
              {mensajeDisponibilidad.mensaje}
            </span>
          </div>

          <div className="acciones-modal campo-completo">

            <button
              type="button"
              onClick={manejarCerrar}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="boton-cambiar-mesa"
              onClick={comprobarDisponibilidad}
            >
              Comprobar disponibilidad
            </button>

            <button
              type="submit"
              className="boton-confirmar-reserva"
            >
              <HeartHandshake />

              Confirmar reserva
            </button>

          </div>

        </form>

      </section>
    </div>
  );
}