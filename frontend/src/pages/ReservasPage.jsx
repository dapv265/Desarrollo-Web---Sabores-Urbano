import { useState } from "react";

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

import {
  horarios,
  mesas,
  reservasIniciales,
} from "../data/reservasData";

import "../styles/reservas.css";


export default function ReservasPage() {

  // =========================================================
  // ESTADO PRINCIPAL DE LAS RESERVAS
  // =========================================================

  const [reservas, setReservas] =
    useState(reservasIniciales);


  // =========================================================
  // DÍA SELECCIONADO EN EL MINI CALENDARIO
  // =========================================================

  const [
    diaSeleccionado,
    setDiaSeleccionado,
  ] = useState(16);


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

  function cambiarEstado(estado) {

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

  function crearReserva(nuevaReserva) {

    setReservas((reservasActuales) => [
      ...reservasActuales,
      nuevaReserva,
    ]);

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

      <section className="contenedor-reservas">


        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <HeaderReservas />


        {/* ===================================================
            BARRA LATERAL
        =================================================== */}

        <SidebarReservas

          diaSeleccionado={
            diaSeleccionado
          }

          onSeleccionarDia={
            setDiaSeleccionado
          }

          estados={
            estados
          }

          onCambiarEstado={
            cambiarEstado
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

        />


      </section>


      {/* =====================================================
          MODAL PARA CREAR UNA NUEVA RESERVA
      ===================================================== */}

      <ModalReserva

        abierto={
          modalAbierto
        }

        reservas={
          reservas
        }

        onCerrar={
          cerrarModal
        }

        onCrearReserva={
          crearReserva
        }

      />


    </section>

  );

}
