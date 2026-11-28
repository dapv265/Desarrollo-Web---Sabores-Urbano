import { apiRequest } from "./api";

function construirQueryReportes({ periodo, restaurante } = {}) {
  const params = new URLSearchParams();

  if (typeof periodo === "string" && periodo.trim() !== "" && periodo !== "Todos") {
    params.set("periodo", periodo.trim());
  }

  if (
    typeof restaurante === "string" &&
    restaurante.trim() !== "" &&
    restaurante !== "Todos"
  ) {
    params.set("restaurante", restaurante.trim());
  }

  return params.toString();
}

export function obtenerReportes({ periodo, restaurante, token } = {}) {
  const query = construirQueryReportes({ periodo, restaurante });
  return apiRequest(query ? `/reportes?${query}` : "/reportes", { token });
}

export function obtenerResumenReportes({ periodo, restaurante, token } = {}) {
  const query = construirQueryReportes({ periodo, restaurante });
  return apiRequest(
    query ? `/reportes/resumen?${query}` : "/reportes/resumen",
    { token },
  );
}

export function crearReporte(reporte, token) {
  return apiRequest("/reportes", {
    method: "POST",
    token,
    body: reporte,
  });
}

export function actualizarReporte(id, reporte, token) {
  return apiRequest(`/reportes/${encodeURIComponent(id)}`, {
    method: "PUT",
    token,
    body: reporte,
  });
}

export function generarReportesDesdePedidos({ periodo, restaurante, token } = {}) {
  return apiRequest("/reportes/generar", {
    method: "POST",
    token,
    body: {
      ...(periodo && periodo !== "Todos" ? { periodo } : {}),
      ...(restaurante && restaurante !== "Todos" ? { restaurante } : {}),
    },
  });
}

export function eliminarReporte(id, token) {
  return apiRequest(`/reportes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}
