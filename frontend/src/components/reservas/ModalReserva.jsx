import { useState } from "react";

import {
  Armchair,
  Calendar,
  CalendarPlus,
  IdCard,
  Clock,
  HeartHandshake,
  MessageSquareText,
  Phone,
  Timer,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { comprobarDisponibilidadReserva } from "../../services/reservasService";

const MENSAJE_INICIAL =
  "Seleccione fecha, hora y mesa para comprobar disponibilidad.";

export default function ModalReserva({
  abierto,
  mesas,
  horarios,
  fechaInicial,
  onCerrar,
  onCrearReserva,
}) {
  const [cliente, setCliente] = useState("");
  const [clienteRut, setClienteRut] = useState("");
  const [telefono, setTelefono] = useState("");
  const [personas, setPersonas] = useState("2");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [mesa, setMesa] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [observaciones, setObservaciones] =
    useState("");

  const [mensajeDisponibilidad, setMensajeDisponibilidad] =
    useState({
      disponible: null,
      mensaje: MENSAJE_INICIAL,
    });

  if (!abierto) {
    return null;
  }

  // Mesas con capacidad suficiente para la cantidad de personas
  const mesasAptas = mesas.filter(
    (item) => item.capacidad >= Number(personas)
  );

  async function comprobarDisponibilidad() {
    if (!fecha || !hora || !mesa) {
      const resultado = {
        disponible: false,
        mensaje: "Complete fecha, hora y mesa para comprobar disponibilidad.",
      };
      setMensajeDisponibilidad(resultado);
      return resultado;
    }

    try {
      const resultado = await comprobarDisponibilidadReserva({
        fecha,
        inicio: hora,
        duracion,
        mesa,
        personas,
      });
      setMensajeDisponibilidad(resultado);
      return resultado;
    } catch (error) {
      const resultado = { disponible: false, mensaje: error.message };
      setMensajeDisponibilidad(resultado);
      return resultado;
    }
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    const resultado =
      await comprobarDisponibilidad();

    if (!resultado.disponible) {
      return;
    }

    const nuevaReserva = {
      clienteRut: clienteRut.trim().toUpperCase(),
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      personas: Number(personas),
      fecha,
      inicio: hora,
      duracion: Number(duracion),
      mesa,
      observaciones,
      estado: "confirmada",
    };

    setGuardando(true);
    try {
      await onCrearReserva(nuevaReserva);
      limpiarFormulario();
      onCerrar();
    } catch (error) {
      setMensajeDisponibilidad({ disponible: false, mensaje: error.message });
    } finally {
      setGuardando(false);
    }
  }

  function limpiarFormulario() {
    setCliente("");
    setClienteRut("");
    setTelefono("");
    setPersonas("2");
    setFecha(fechaInicial);
    setHora("");
    setDuracion("60");
    setMesa("");
    setObservaciones("");

    setMensajeDisponibilidad({
      disponible: null,
      mensaje: MENSAJE_INICIAL,
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

            <label htmlFor="rutCliente">
              <IdCard />
              RUT
            </label>

            <input
              id="rutCliente"
              type="text"
              placeholder="12.345.678-9"
              pattern="\d{1,2}\.\d{3}\.\d{3}-[\dkK]"
              title="Formato 12.345.678-9"
              value={clienteRut}
              onChange={(evento) =>
                setClienteRut(evento.target.value)
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
              required
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
              onChange={(evento) => {
                setPersonas(evento.target.value);
                setMesa("");
              }}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((cantidad) => (
                <option key={cantidad} value={cantidad}>
                  {cantidad} {cantidad === 1 ? "persona" : "personas"}
                </option>
              ))}
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

            <select
              id="horaReserva"
              value={hora}
              onChange={(evento) =>
                setHora(evento.target.value)
              }
              required
            >
              <option value="">Seleccione hora</option>
              {horarios.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>

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
              required
            >
              <option value="">Seleccione mesa</option>
              {mesasAptas.map((item) => (
                <option key={item.id} value={item.id}>
                  Mesa {item.numero} - {item.zona} - {item.capacidad} personas
                </option>
              ))}
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
              disabled={guardando}
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