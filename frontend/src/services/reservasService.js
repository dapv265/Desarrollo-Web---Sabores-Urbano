// Servicio de integración con el backend - Reservas

import { API_BASE_URL } from "./api";

// Error con los datos que devuelve la API de reservas:
// { mensaje, errores: [...], conflicto } y el código HTTP en `status`
function crearErrorReserva(datos, status, mensajePorDefecto) {
  const error = new Error(datos?.mensaje || mensajePorDefecto);

  error.status = status;
  error.errores = Array.isArray(datos?.errores) ? datos.errores : [];
  error.conflicto = datos?.conflicto ?? null;

  return error;
}

// Hace la petición y devuelve el JSON, o lanza un error con los datos del backend
async function solicitar(ruta, { method = "GET", body } = {}, mensajePorDefecto) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw crearErrorReserva(
      null,
      0,
      "No se pudo conectar con el servidor. Verifica que el backend esté disponible."
    );
  }

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch {
    // Respuesta sin cuerpo JSON
  }

  if (!respuesta.ok) {
    throw crearErrorReserva(datos, respuesta.status, mensajePorDefecto);
  }

  return datos;
}

// Listar reservas. Filtros opcionales: fecha, estado, mesa, clienteRut
export async function obtenerReservas(filtros = {}) {
  const parametros = new URLSearchParams();

  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) {
      parametros.set(clave, valor);
    }
  }

  const consulta = parametros.toString();

  const datos = await solicitar(
    `/reservas${consulta ? `?${consulta}` : ""}`,
    {},
    "No se pudieron obtener las reservas."
  );

  return datos?.reservas ?? [];
}

// Reservas de un día (AAAA-MM-DD)
export function obtenerReservasPorFecha(fecha) {
  return obtenerReservas({ fecha });
}

// Devuelve { disponible, mensaje, conflicto }
export function comprobarDisponibilidadReserva({ fecha, inicio, duracion, mesa, personas }) {
  const parametros = new URLSearchParams({
    fecha,
    inicio,
    duracion: String(duracion),
    mesa,
    personas: String(personas),
  });

  return solicitar(
    `/reservas/disponibilidad?${parametros}`,
    {},
    "No se pudo comprobar la disponibilidad."
  );
}

export async function crearReserva(reserva) {
  const datos = await solicitar(
    "/reservas",
    { method: "POST", body: reserva },
    "No se pudo crear la reserva."
  );

  return datos.reserva;
}

// Editar una reserva (PUT, acepta duracion en minutos)
export async function actualizarReserva(id, reserva) {
  const datos = await solicitar(
    `/reservas/${encodeURIComponent(id)}`,
    { method: "PUT", body: reserva },
    "No se pudo actualizar la reserva."
  );

  return datos.reserva;
}

export async function cambiarEstadoReserva(id, estado) {
  const datos = await solicitar(
    `/reservas/${encodeURIComponent(id)}/estado`,
    { method: "PATCH", body: { estado } },
    "No se pudo cambiar el estado de la reserva."
  );

  return datos.reserva;
}

export async function eliminarReserva(id) {
  const datos = await solicitar(
    `/reservas/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "No se pudo eliminar la reserva."
  );

  return datos.reserva;
}
