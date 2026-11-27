// Servicio de integración con el backend - Reservas
import { requestJson } from "./api";

export async function obtenerReservasPorFecha(fecha) {
  const datos = await requestJson(`/reservas?fecha=${encodeURIComponent(fecha)}`);
  return datos.reservas || [];
}

export function comprobarDisponibilidadReserva({ fecha, inicio, duracion, mesa, personas }) {
  const parametros = new URLSearchParams({
    fecha,
    inicio,
    duracion: String(duracion),
    mesa,
    personas: String(personas),
  });

  return requestJson(`/reservas/disponibilidad?${parametros}`);
}

export async function crearReserva(reserva) {
  const datos = await requestJson("/reservas", { method: "POST", body: reserva });
  return datos.reserva;
}

export async function cambiarEstadoReserva(id, estado) {
  const datos = await requestJson(`/reservas/${id}/estado`, {
    method: "PATCH",
    body: { estado },
  });
  return datos.reserva;
}
