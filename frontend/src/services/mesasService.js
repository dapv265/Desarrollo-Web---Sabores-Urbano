
// Servicio de integración con el backend - RF3 y RF5

import { API_BASE_URL } from "./api";

// Obtener todas las mesas - RF3
export async function obtenerMesas() {
  const respuesta = await fetch(`${API_BASE_URL}/mesas`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron obtener las mesas.");
  }

  return respuesta.json();
}

// Obtener restaurantes registrados
export async function obtenerRestaurantes() {
  const respuesta = await fetch(
    `${API_BASE_URL}/restaurantes`
  );

  const datos = await respuesta.json();

  if (!respuesta.ok || datos.success === false) {
    throw new Error(
      datos.mensaje ||
      "No se pudieron obtener los restaurantes."
    );
  }

  return datos.data || [];
}

function headersConAuth(token, conJson = false) {
  const headers = {};
  if (conJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Actualizar estado - RF3
export async function actualizarEstadoMesa(id, estado, token) {
  const respuesta = await fetch(
    `${API_BASE_URL}/mesas/${encodeURIComponent(id)}/estado`,
    {
      method: "PATCH",
      headers: headersConAuth(token, true),
      body: JSON.stringify({ estado }),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || datos.message || "No se pudo actualizar la mesa."
    );
  }

  return datos.mesa;
}

// Consultar disponibilidad con filtros - RF5
export async function obtenerDisponibilidad(filtros = {}) {
  const parametros = new URLSearchParams();

  if (filtros.personas) {
    parametros.set("personas", filtros.personas);
  }

  if (filtros.fecha) {
    parametros.set("fecha", filtros.fecha);
  }

  if (filtros.hora) {
    parametros.set("hora", filtros.hora);
  }

  if (filtros.fecha && filtros.hora && filtros.duracion) {
    parametros.set("duracion", filtros.duracion);
  }

  if (filtros.zona && filtros.zona !== "todas") {
    parametros.set("zona", filtros.zona);
  }

  // Nuevo filtro por restaurante
  if (
    filtros.restauranteCodigo &&
    filtros.restauranteCodigo !== "todos"
  ) {
    parametros.set(
      "restauranteCodigo",
      filtros.restauranteCodigo
    );
  }

  const consulta = parametros.toString();

  const url = `${API_BASE_URL}/mesas/disponibilidad${
    consulta ? `?${consulta}` : ""
  }`;

  const respuesta = await fetch(url);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
      "No se pudo consultar la disponibilidad de mesas."
    );
  }

  return datos;
}

// Crear mesa - RF3
export async function crearMesa(mesa, token) {
  const respuesta = await fetch(`${API_BASE_URL}/mesas`, {
    method: "POST",
    headers: headersConAuth(token, true),
    body: JSON.stringify(mesa),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || datos.message || "No se pudo crear la mesa."
    );
  }

  return datos.mesa;
}

// Editar mesa - RF3
export async function actualizarMesa(id, mesa, token) {
  const respuesta = await fetch(
    `${API_BASE_URL}/mesas/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: headersConAuth(token, true),
      body: JSON.stringify(mesa),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || datos.message || "No se pudo editar la mesa."
    );
  }

  return datos.mesa;
}

// Eliminar mesa - RF3
export async function eliminarMesa(id, token) {
  const respuesta = await fetch(
    `${API_BASE_URL}/mesas/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: headersConAuth(token),
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || datos.message || "No se pudo eliminar la mesa."
    );
  }

  return datos;
}
