import { useCallback, useEffect, useState } from "react";

import HeaderReservas
  from "../components/reservas/HeaderReservas";

import SidebarReservas
  from "../components/reservas/SidebarReservas";

import CalendarioReservas
  from "../components/reservas/CalendarioReservas";

import DetalleReserva
  from "../components/reservas/DetalleReserva";

import ModalReserva
  from "../components/reservas/ModalReserva";

import { horarios } from "../data/reservasData";

import { obtenerMesas } from "../services/mesasService";

import {
  cambiarEstadoReserva,
  crearReserva as crearReservaApi,
  obtenerReservasPorFecha,
} from "../services/reservasService";

import {
  fechaDeHoy,
  sumarDias,
} from "../utils/reservasUtils";

import "../styles/reservas.css";


export default function ReservasPage() {

  // =========================================================
  // DATOS DEL BACKEND
  // =========================================================

  const [reservas, setReservas] =
    useState([]);

  const [mesas, setMesas] =
    useState([]);

  const [error, setError] =
    useState("");


  // =========================================================
  // FECHA SELECCIONADA (AAAA-MM-DD)
  // =========================================================

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState(fechaDeHoy);


  // =========================================================
  // VISTA DEL CALENDARIO
  // Día / Semana / Mes
  // =========================================================

  const [vista, setVista] =
    useState("dia");


  // =========================================================
  // RESERVA SELECCIONADA
  // Se utiliza para mostrar el detalle
  // =========================================================

  const [
    reservaSeleccionada,
    setReservaSeleccionada,
  ] = useState(null);


  // =========================================================
  // ESTADO DEL MODAL
  // false = cerrado
  // true = abierto
  // =========================================================

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);


  // =========================================================
  // CARGA DE MESAS Y RESERVAS
  // =========================================================

  const cargarReservas = useCallback(async (fecha) => {
    setReservas(await obtenerReservasPorFecha(fecha));
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerMesas()
      .then((mesasApi) => {
        // Las mesas fuera de servicio no se pueden reservar
        if (activo) setMesas(mesasApi.filter((mesa) => mesa.estado !== "fuera"));
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerReservasPorFecha(fechaSeleccionada)
      .then((reservasApi) => {
        if (!activo) return;
        setReservas(reservasApi);
        setError("");
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });

    return () => {
      activo = false;
    };
  }, [fechaSeleccionada]);


  function seleccionarFecha(fecha) {
    setFechaSeleccionada(fecha);
    setReservaSeleccionada(null);
  }


  // =========================================================
  // FILTROS POR ESTADO
  // =========================================================

  const [
    estados,
    setEstados,
  ] = useState({
    confirmada: true,
    pendiente: true,
    "en-espera": true,
    cancelada: true,
  });


  // =========================================================
  // CAMBIAR UN FILTRO
  // =========================================================

  function cambiarFiltroEstado(estado) {

    setEstados((anteriores) => ({
      ...anteriores,
      [estado]: !anteriores[estado],
    }));

  }


  // =========================================================
  // RESTABLECER LOS FILTROS
  // =========================================================

  function limpiarFiltros() {

    setEstados({
      confirmada: true,
      pendiente: true,
      "en-espera": true,
      cancelada: true,
    });

  }


  // =========================================================
  // ABRIR MODAL
  // =========================================================

  function abrirModal() {

    setModalAbierto(true);

  }


  // =========================================================
  // CERRAR MODAL
  // =========================================================

  function cerrarModal() {

    setModalAbierto(false);

  }


  // =========================================================
  // CREAR NUEVA RESERVA
  // =========================================================

  // Lanza el error al modal para que lo muestre
  async function crearReserva(nuevaReserva) {

    await crearReservaApi(nuevaReserva);

    if (nuevaReserva.fecha === fechaSeleccionada) {
      await cargarReservas(fechaSeleccionada);
    } else {
      setFechaSeleccionada(nuevaReserva.fecha);
    }

  }


  // =========================================================
  // CONFIRMAR O CANCELAR UNA RESERVA
  // =========================================================

  async function cambiarEstado(reserva, estado) {

    try {
      const actualizada = await cambiarEstadoReserva(reserva._id, estado);
      setReservaSeleccionada(actualizada);
      await cargarReservas(fechaSeleccionada);
      setError("");
    } catch (err) {
      setError(err.message);
    }

  }


  // =========================================================
  // FILTRAR RESERVAS
  // =========================================================

  const reservasFiltradas =
    reservas.filter((reserva) => {

      return estados[reserva.estado];

    });


  // =========================================================
  // INTERFAZ
  // =========================================================

  return (

    <section className="pagina-reservas">

      {error && (
        <p className="bg-red-50 text-red-700 border-l-4 border-red-500 p-3 rounded mb-4" role="alert">
          {error}
        </p>
      )}

      <section className="contenedor-reservas">


        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <HeaderReservas />


        {/* ===================================================
            BARRA LATERAL
        =================================================== */}

        <SidebarReservas

          fechaSeleccionada={
            fechaSeleccionada
          }

          onSeleccionarFecha={
            seleccionarFecha
          }

          estados={
            estados
          }

          onCambiarEstado={
            cambiarFiltroEstado
          }

          onLimpiar={
            limpiarFiltros
          }

        />


        {/* ===================================================
            CALENDARIO PRINCIPAL
        =================================================== */}

        <CalendarioReservas

          mesas={
            mesas
          }

          horarios={
            horarios
          }

          fecha={
            fechaSeleccionada
          }

          onCambiarDia={(dias) =>
            seleccionarFecha(sumarDias(fechaSeleccionada, dias))
          }

          reservas={
            reservasFiltradas
          }

          vista={
            vista
          }

          onCambiarVista={
            setVista
          }

          onNuevaReserva={
            abrirModal
          }

          onSeleccionarReserva={
            setReservaSeleccionada
          }

        />


        {/* ===================================================
            DETALLE DE LA RESERVA
        =================================================== */}

        <DetalleReserva

          reserva={
            reservaSeleccionada
          }

          onCerrar={() =>
            setReservaSeleccionada(null)
          }

          onCambiarEstado={
            cambiarEstado
          }

        />


      </section>


      {/* =====================================================
          MODAL PARA CREAR UNA NUEVA RESERVA
      ===================================================== */}

      {/* Se monta al abrirse para que parta con la fecha que se está viendo */}
      {modalAbierto && (
      <ModalReserva

        abierto={
          modalAbierto
        }

        mesas={
          mesas
        }

        horarios={
          horarios
        }

        fechaInicial={
          fechaSeleccionada
        }

        onCerrar={
          cerrarModal
        }

        onCrearReserva={
          crearReserva
        }

      />
      )}


    </section>

  );

}
